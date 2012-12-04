Title: 48 Hours of Hacks: Making A Quake 3 Plugin For The Browser
Published: February 12, 2012

After a recent late-night [QuakeLive](http://www.quakelive.com) session, I was curious to know how exactly it worked. Having never written a browser plugin, there were a lot of questions running through my head. How much porting was actually done as far as the engine was concerned? Can we use new technology like WebGL?  Did the networking layer have to change to deal with browser restrictions?

With a free upcoming weekend, I set out to answer these questions by getting the excellent [ioquake3](http://www.ioquake3.org) project up and running in the browser and document my process along the way.

## Preliminary research

As I said, some of my initial concerns were:

#### Plugins sound lame, can't we use WebGL?

[WebGL](http://en.wikipedia.org/wiki/WebGL) is all the rage and the experience of installing plugins feels lame. However, after a quick read on WebGL I learned it's not useful for our purpose. WebGL is a set of OpenGL bindings for JavaScript that enable you to render to an HTML5 canvas element. Unless you were to port the entire engine/game to run natively in JavaScript (or, cross-compile from C to JavaScript with [cluecc](http://cluecc.sourceforge.net) for < 1% of the original performance), a custom plugin is the way to go.

#### How difficult is it to write a cross-browser plugin?

As it turns out, writing a cross-browser plugin in our case isn't too bad. Both Firefox and Chrome use the [NPAPI plugin architecture](http://en.wikipedia.org/wiki/NPAPI), and IE uses ActiveX. While multiple architectures can be frustrating, there is a plugin framework, [firebreath](http://www.firebreath.org), that makes working with both easy. Firebreath exposes an API that abstracts out the browser-specific implementations and will compile down to either an NPAPI or ActiveX plugin.

#### How bad are we sandboxed when running inside a plugin?

Finally, the sandboxing was a big concern; too much porting work would be a show-stopper. However, somewhat to my dismay, I learned that both NPAPI and ActiveX plugins can run native machine instructions with the same privileges as the host process. This means we can spawn processes and load libraries freely, perform file I/O with no permission problems, and no networking adjustments would need to be made to the engine for network play.

## Getting started

After 10+ years of dedicated internet surfing and many years of web development I realized I still honestly had no idea what a plugin meant to a browser. If you're in the same boat, I suggest reading [this article](http://colonelpanic.net/2010/08/browser-plugins-vs-extensions-the-difference/) by the author of firebreath.

In summary, the important things to understand before moving on are:

 * The plugin is instantiated when an <object> tag matching our MIME type is embedded.
 * Upon creation, we're passed a window handle relative to the embedded <object>.
 * We can access the filesystem.
 * We can spawn processes.
 * We can create sockets.

After a few hours, I had a plugin up and running that spawned the ioquake3 process as a separate process in a new window when the plugin was loaded. Now I needed to make the game render in our plugin's window as opposed to creating a new one. Thanks to ioquake3's use of SDL, this turned out to be trivial. SDL honors an environment variable `SDL_WINDOWID` when creating a window; if the envrionment variable is set, the specified window is used for rendering, else a new window is created.

[By setting this variable](https://github.com/inolen/q3plugin/blob/master/plugin/X11/GameProcessX11.cc#L22) to the native window id provided by firebreath before launching the process, the game was officially up and running in the browser!

## Handling input

After 5 short-lived seconds of victory, I realized that while the game rendered, none of my input was being handled. Googling for a magic fix revealed that this is a [common problem](http://sdl.beuc.net/sdl.wiki/FAQ_GUI#head-6679d7ab4ae4136379afa4f16f16bbbd874f073b) due to the plugin's event loop now gobbling up all the input events before the SDL layer in the game can. I thought `SDL_WM_GrabInput` was supposed to resolve situations such as this, but in our case it wasn't.

As far as I could tell, we had two options here:

1. Create a shim library that forwards the input from the plugin to the game.
2. Dig through the SDL haystack and try to find a proper fix for `SDL_WM_GrabInput`.

The 48 hour time constraint made navigating the SDL source seem too idealistic, and a shim library would function doubly as a generic way to pass messages bidirectional between the plugin and game (which would help out with future plans such as the web-based server browser). All things considered, I chose the shim library route.

## What's a shim?

A shim is a middleware library injected into a process in order to intercept function calls between the process and another library.

When the OS loads an executable it invokes the dynamic linker (`ld.so` on Linux systems) which is responsible for loading dependent shared libraries for the executable. The specifics are OS dependant, but to continue with Linux as our example, ld.so will honor the environment variable `LD_PRELOAD` to preload a specific list of shared libraries before any implicit ones. In the case of duplicate symbols, it will favor the library that was loaded first, enabling our custom library to override the original implementation.

Furthermore, there exists functionality to walk the symbol tree. The most useful function to us on Linux being `dlsym()` with the `RTLD_NEXT` flag, which searches the symbol tree for the next instance of a specific symbol, starting _after_ the current library. This enables us to call back to the original functionality from within our hooked implementation.

## Designing our shim

Now that we know how to create and load a shim, let's look back to our input problem and see what we need to do.

#### Setup an IPC system between the plugin and the shim

We'll need a way to have full-duplex communciation between the plugin and the shim. We need to send input events from the plugin _to_ the shim, as well as recieve events in the plugin _from_ the shim. To do so, we're using a [light-weight wrapper](https://github.com/inolen/q3plugin/blob/master/plugin/MessagePipe.cc) around boost::message_queue.

Now, while it's no problem to receive messages on the plugin side, doing so in the shim is a little trickier. The seemingly obvious idea would be to spawn a thread that will poll our message queue inside the shim's entry point, but creating a new thread inside a shared library's entry point will [probably cause a deadlock](http://www.voyce.com/index.php/2009/12/03/dont-do-anything-in-dllmain-please/). There are many other possible solutions, but I chose to [hook SDL_PollEvent](https://github.com/inolen/q3plugin/blob/master/plugin/shim/main.cc#L34) and make it poll our own queue right before it polls its own:

    extern "C" int SDL_PollEvent(SDL_Event *event) {
      static int (*func)(SDL_Event*) = NULL;

      if (!func) {
        func = (int (*)(SDL_Event*))dlsym(RTLD_NEXT, "SDL_PollEvent");
      }

      // Poll our own event queue when SDL polls.
      ProcessMessages();

      // Call the original SD_PollEvent.
      return (*func)(event);
    }
{: class="prettyprint linenums"}

Take note of line 5, where we store a pointer to the next instance of the SDL\_PollEvent symbol (which presumably comes from the real SDL library). We then at line 12, after we are done with our own work, call it in order to preserve the original SDL\_PollEvent's functionality.

#### Forward input events from the plugin to the game

Now that our IPC system is functioning, we can take keyboard and mouse input events and send them to the shim. The only question is, how do we pass them from inside the shim to the SDL layer in the game?

If you paid close attention to how we called into the original SDL\_PollEvent, you'll realize we can do the same with SDL\_SendMessage. After we poll our message queue in our hooked SDL_PollEvent from above, we check if it's an input event and if so, [forward it to the real SDL_SendMessage](https://github.com/inolen/q3plugin/blob/master/plugin/shim/main.cc#L73):

    // Get the address of the original SDL_PushEvent function.
    OG_SDL_PushEvent = (int (*)(SDL_Event*))dlsym(RTLD_NEXT, "SDL_PushEvent");
    ...
    while (g_msgpipe->Poll(msg)) {
      switch (msg.type) {
        case SDLEVENT:
          OG_SDL_PushEvent(&msg.sdlevent.event);
          break;
{: class="prettyprint linenums"}

## Wrapping up

Now that we've got the game running and input shimmed, the game should be in a perfectly playable state. However, we're still not taking advantage of some of the interesting aspects of running the game in the browser (e.g. allowing users to interact with game via the actual page the plugin is embedded on).

After the initial weekend of work I spent some time making the project presentable, and also added an in-browser master server browser that takes advantage of some of these aspects which I'll write about later.

For now, if you're interested, [check out the project on github](https://github.com/inolen/q3plugin) and enjoy.

![quake3 browser plugin](/articles/48-hours-of-hacks-quake3-browser-plugin/q3plugin_screenshot0.jpg)
![quake3 browser plugin](/articles/48-hours-of-hacks-quake3-browser-plugin/q3plugin_screenshot1.jpg)
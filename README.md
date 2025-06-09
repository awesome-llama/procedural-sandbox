# Procedural Sandbox

A Scratch project designed to procedurally generate image textures. You could think of it as a combination of *[Image Editor](https://scratch.mit.edu/projects/552647396/)* and *[3D Terrain Generator](https://scratch.mit.edu/projects/600000129/)*.

This project intends on:

- Exploring ways to generate source textures for future Scratch games, especially 3D games like *[The Mast](https://scratch.mit.edu/projects/861541218/)*.
- Testing goboscript, which is a programming language that compiles to Scratch.
- Further developing user interface handling for Scratch projects.
- Experimenting with exporting to different file formats such as [TextImage](https://github.com/awesome-llama/TextImage) and generation of [data URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data) for a way to download these files.
- Testing variations on the "main loop" and similar techniques as seen in previous projects.
- Being an opportunity to learn path tracing implementations.


## Description

The project uses a 3D voxel "canvas" with each voxel storing red, green, blue, opacity, and emission data, in the range 0.0-1.0 (inclusive). The canvas wraps on the X and Y axes allowing for seamless texture generation. The canvas may be of any dimensions larger than 0. As this is mostly catered to 2D textures, most canvases will be considerably wider than they are tall.

The screen consists of a *viewport*, a *side bar*, and a *top bar*. 

The viewport displays the canvas, which may be navigated by clicking and dragging or pressing the WASD keys. Mouse scroll wheel to zoom.

The top bar has various easy-to-access buttons including switching between top-down 2D and 3D mode, choosing a rendering mode, and zooming the viewport.

The side bar can display a stack of "modular" UI elements for performing tasks such as import/export, texture generation, and special effects.

TextImage is the supported image format for this project. Use the converter tool here: https://awesome-llama.github.io/utils/TextImage


## Dependencies

- [goboscript](https://github.com/aspizu/goboscript/releases/tag/v3.2.1) 3.2.1
- Python 3.12 (not tested on older Python 3 versions but they are probably fine too)


## Building

Assuming you have the above dependencies installed and the repo is cloned to your computer...

1. Run `src/data_URL/process.py` to generate the data URL list data.
2. Run `src/UI/UI_creator.py` to create the user interface list data.
3. Run the goboscript build command: `goboscript build -i src -o "Procedural Sandbox.sb3"`. An sb3 file will be generated.
4. Run `src/post-processing/main.py` to perform final clean up on the sb3 file. 
5. The sb3 file can be opened up in Scratch or [TurboWarp](https://turbowarp.org/) (recommended).

If using Visual Studio Code, you can run the build tasks. The default task does not generate lists. Use the full build for this.


## Contributing

Feel free to fork the repository and make pull requests. There are no specific contributing guidelines currently, it's an open-ended "do whatever you think would fit". If you are unsure whether a change would be accepted, consider asking.

Places where improvements could be seen include new texture generators (especially this!), path tracing, and more supported file formats. For mostly standalone code such as generators, you may alternatively remix the Scratch project. This is less efficient as you won't be able to make use of goboscript's features and someone would have to translate it into goboscript to be added to this repo.

Accepted code contributions will be credited in the project's built-in credits page (in settings) as well as in the Scratch "notes and credits" box.


### Contributing a texture generator

All texture generators are defined in the `generator.gs` sprite file.

A generator has a broadcast receiver hat named "gen.{GENERATOR_NAME}.run". This is how a generator is run. Typically a button in the user interface will trigger this. This script retrieves the settings from the user interface, whose values are temporarily stored in the list `UI_return`. This script then calls the custom block of the same name as the generator.

The custom block first runs `reset_generator` to reset the canvas and set it up for a generator to run. Typically the lowest layer of voxels is then drawn. This is followed by the rest of the generator's behaviour setting the other canvas voxels, and finally the `generator_finished` custom block is called to indicate the screen should be refreshed and camera should be repositioned.

You may notice this thing called a "depositor". This specifies the type of voxel that should be drawn to the canvas, in a similar way you can choose a color or pattern to draw in image editing/drawing software. All the shape drawing custom blocks (such as cuboids, spheres, lines, etc.) use the depositor instead of having arguments for what kind of voxel they should draw.

Have a look at the "Extruded grid" or "Hedge" generators first if you want practical code examples or something to copy or modify.

A generator is not complete without the user interface. This is set up through the python script `UI_creator.py`. This script contains classes for the different interface elements, which are eventually written to various text files representing list items for Scratch. You'll find the IDs for these elements to correspond with the broadcast script of the generator. Again, have a look at the existing generators to learn how to do this.

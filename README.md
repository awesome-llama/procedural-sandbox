# Procedural Sandbox
A Scratch project designed to procedurally generate textures. You could think of it as a combination of *Image Editor* and *3D Terrain Generator*. 

Written in [goboscript](https://github.com/aspizu/goboscript).


## Project Instructions
The project uses a 3D voxel "canvas" with each voxel storing red, green, blue, opacity, and emission data, in the range 0.0-1.0 (inclusive). The canvas wraps on the X and Y axes allowing for seamless texture generation. The canvas may be of any dimensions larger than 0.

The screen consists of a *viewport*, a *side bar*, and a *top bar*. 

The viewport displays the canvas, which may be navigated by clicking and dragging or pressing the WASD keys. Mouse scroll wheel (or up/down arrow keys) to zoom.

The top bar has various easy-to-access buttons.

The side bar is a stack of modular UI elements for performing any task such as import/export, texture generation, and special effects.

TextImage is the supported image format for this project. Use the converter tool here: https://awesome-llama.github.io/utils/TextImage


## Dependencies
- goboscript 3.2
- Python 3.12


## Building

1. Run `src/data_URL/process.py` to generate the data URL list data.
2. Run `src/UI/UI_creator.py` to create the user interface list data.
3. Run the goboscript build command. `goboscript build -i src -o "Procedural Sandbox.sb3"`. An sb3 file will be generated. This can be opened up in Scratch or TurboWarp (recommended).

If using Visual Studio Code, you can run the Build tasks. The default task does not generate data URL lists. Use the full build for this.



# Procedural Sandbox
A Scratch project designed to procedurally generate textures. You could think of it as a combination of *Image Editor* and *3D Terrain Generator*. 

Written in [goboscript](https://github.com/aspizu/goboscript).

# Project Instructions
The project uses a 3D voxel "canvas" with each voxel storing red, green, blue, opacity, and emission data, in the inclusive range 0.0-1.0. The canvas wraps on the X and Y axes allowing for seamless texture generation.

The screen consists of a *viewport*, a *side bar*, and a *top bar*. 

The viewport displays the canvas, which may be navigated by clicking and dragging or pressing the WASD keys. Mouse scroll wheel (or up/down arrow keys) to zoom.

# Dependencies
- goboscript 3.1.0 or higher
- Python 3.12 or higher

# Building
1. Run `UI_creator.py` to create the user interface list data.
2. Run the goboscript build command. If using Visual Studio Code, you may run the build task. An sb3 file will be generated. This may be opened up in Scratch or TurboWarp (recommended).



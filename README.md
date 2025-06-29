# Procedural Sandbox

A Scratch project designed to procedurally generate image textures. You could think of it as a combination of *[Image Editor](https://scratch.mit.edu/projects/552647396/)* and *[3D Terrain Generator](https://scratch.mit.edu/projects/600000129/)*.

This project intends on:

- Exploring ways to generate source textures for future Scratch games, especially 3D games like *[The Mast](https://scratch.mit.edu/projects/861541218/)*.
- Testing goboscript, which is a programming language that compiles to Scratch.
- Developing Python-based tools for generating data and editing projects.
- Further developing user interface handling for Scratch projects.
- Experimenting with exporting to different file formats such as [TextImage](https://github.com/awesome-llama/TextImage) and generation of [data URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data) for a way to download these files.
- Testing variations on the "main loop" and similar techniques as seen in previous projects.
- Being an opportunity to learn path tracing implementations.
- Exploring the feasibility of a programming language running in Scratch.


The project uses a 3D voxel "canvas" with each voxel storing red, green, blue, opacity, and emission data, in the range 0.0-1.0 (inclusive). The canvas wraps on the X and Y axes allowing for seamless texture generation. As this is mostly catered to 2D textures, most canvases will be considerably wider than they are tall.

TextImage is the supported image format for this project. Use the converter tool here: https://awesome-llama.github.io/utils/TextImage


## Dependencies

- [goboscript](https://github.com/aspizu/goboscript/commit/a71d04c441b4f8e2bb470698e4e66adbcc313fa1) (not release v3.2.1, it lacks some fixes)
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

Places where improvements could be seen include new texture generators (especially this!), path tracing, and more supported file formats. For mostly standalone code such as generators, you may alternatively remix the Scratch project. This is less efficient as you won't be able to make use of goboscript's features and someone would have to translate it into goboscript to be added to this repo. Writing the generator in the custom programming language is allowed too.

Accepted code contributions will be credited in the project's built-in credits page (in settings) as well as in the Scratch "notes and credits" box.

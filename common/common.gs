# Common library for all sprites in this project

costumes "costumes/blank.svg";

proc comment comment {} # custom block comment


struct RGB {
    r,
    g,
    b
}

# the voxel struct for the canvas
struct voxel {
    opacity,
    r,
    g,
    b,
    emission
}

struct pos {
    x,
    y,
    z
}

enum CompositorMode {
    NONE = "",
    COLOR = "COLOR", # RGB & Alpha only
    SHADED = "SHADED", # fully processed colour
    HEIGHT = "HEIGHT", # heightmap, topmost voxel elevation
    AO = "AO", # ambient occlusion
    PENETRATION = "PENETRATION", # colour by how much light penetrates through, for visualising transparency
    THICKNESS = "THICKNESS" # number of voxels in the column
}
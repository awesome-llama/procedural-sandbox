# Common library of miscellaneous items for all sprites in this project.
# Not a valid sprite by iself.

#costumes "costumes/blank.svg";

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
# It had been considered to include a "tag" attribute to the voxel but decided against it because it deviates from the project's purpose which is bitmap art tool first. Tags used to filter generation to particular voxels is a use case but is not important enough to support. Instead, implement a custom solution using an additional list where needed. Another use case is for exporting to other software, e.g. Minecraft, where block types could be included. Again it's not the project's purpose and it's better to write a converter using the voxel RGB values instead. Tags come with additional issues that make it not worth implementing, including performance (having another list), and there not being an existing file format or save code format to support such data compressed. Keeping support with TextImage is best.

%define VOXEL_SOLID(R,G,B) voxel { opacity:1, r:(R), g:(G), b:(B), emission:0 }
%define VOXEL_NONE() voxel { opacity:0, r:0, g:0, b:0, emission:0 }

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
    DENSITY = "DENSITY", # number of voxels in the column, weighted by opacity
    PENETRATION = "PENETRATION" # opacity of topmost non-empty voxel
}


%define COMBINE_RGB_CHANNELS(R,G,B) (65536*floor(255*(R)) + 256*floor(255*(G)) + floor(255*(B)))

%define POW(BASE,EXP) antiln(ln(BASE)*(EXP))


# debug blocks
# proc _error message {
#     add "err: " & message to project_messages;
# }

# proc _warn message {
#     add "warn: " & message to project_messages;
# }

# proc _log message {
#     add message to project_messages;
# }
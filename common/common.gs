# Common library of miscellaneous items for all sprites in this project.
# Not a valid sprite by iself.

#costumes "costumes/blank.svg";


################################

# RGB channels
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

# solid RGB
%define VOXEL_SOLID(R,G,B) voxel { opacity:1, r:(R), g:(G), b:(B), emission:0 }

# solid greyscale (note that the input must return the same value for all uses)
%define VOXEL_SOLID_GREY(VAL) voxel { opacity:1, r:(VAL), g:(VAL), b:(VAL), emission:0 } # greyscale

# greyscale light (note that the input must return the same value for all uses)
%define VOXEL_LIGHT(VAL) voxel { opacity:1, r:(VAL), g:(VAL), b:(VAL), emission:(VAL) } # greyscale

# empty colourless air, no parameters
%define VOXEL_NONE voxel { opacity:0, r:0, g:0, b:0, emission:0 }


# generic 3D point
struct XYZ {
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


enum DepositorMode {
    DRAW = 0, # draw a voxel stored
    TEXTURE = 1 # look up from texture list
}

struct texture_metadata {
    ptr,
    sx,
    sy,
    sz
}


# random positions

%define RANDOM_X random(0, canvas_size_x-1)

%define RANDOM_Y random(0, canvas_size_y-1)

%define RANDOM_Z random(0, canvas_size_z-1)


################################
#             Math             #
################################

# note the placement of numbers before args and the use of floor.
%define COMBINE_RGB_CHANNELS(R,G,B) (65536*floor(255*(R)) + 256*floor(255*(G)) + floor(255*(B)))

%define POW(BASE,EXP) antiln(ln(BASE)*(EXP))

# TODO find a better name
%define ROOT(BASE,R) antiln(ln(BASE)/(R))

# convert 3D coordinates into index, wrapping along all axes. Remember that lists are 1-indexed.
%define INDEX_FROM_3D(X,Y,Z,SIZE_X,SIZE_Y,SIZE_Z) (1 + ((((SIZE_X)*(SIZE_Y)) * (floor(Z) % (SIZE_Z))) + (((SIZE_X)*(floor(Y) % (SIZE_Y))) + (floor(X) % (SIZE_X)))))

# Same as INDEX_FROM_3D but for the canvas, which only wraps along X and Y.
%define INDEX_FROM_3D_CANVAS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * floor(Z)) + (((SIZE_X)*(floor(Y) % (SIZE_Y))) + (floor(X) % (SIZE_X)))))


# TODO HSV to linear RGB
#func HSV_to_RGB


################################
#             Misc             #
################################

proc comment comment {} # custom block comment


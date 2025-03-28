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
    PENETRATION = "PENETRATION", # opacity of topmost non-empty voxel
    NORMAL = "NORMAL" # heightmap converted to normal map
}

enum ViewportMode {
    COMPOSITOR = "COMPOSITOR", # compositor based
    _3D = "3D" # 3D renderer
}

enum DepositorMode {
    DRAW = 0, # draw a voxel stored
    TEMPLATE = 1 # look up from list of saved templates
}

struct template_metadata {
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

# 1 if positive, -1 if negative
%define SIGN(VAL) ((VAL)/abs(VAL))

# floored RGB channels to integer
%define COMBINE_RGB_CHANNELS(R,G,B) (65536*floor(255*(R)) + 256*floor(255*(G)) + floor(255*(B)))

# Power
%define POW(BASE,EXP) antiln(ln(BASE)*(EXP))

# 
%define ROOT(BASE,R) antiln(ln(BASE)/(R))

# logarithm of any base
%define LOG(VAL,BASE) (ln(VAL)/ln(BASE))

# Dot product
%define DOT_PRODUCT_2D(X1,Y1,X2,Y2) ((X1)*(X2) + (Y1)*(Y2))

# Length of a 2D vector
%define VEC2_LEN(VX,VY) sqrt((VX)*(VX) + (VY)*(VY))

# Length of a 3D vector
%define VEC3_LEN(VX,VY,VZ) sqrt((VX)*(VX) + (VY)*(VY) + (VZ)*(VZ))

# Vector angle
%define ATAN2(Y,X) (atan((Y)/((X)+0)) + 180*((X)<0))


# Clamp above 0
%define POSITIVE_CLAMP(VAL) (((VAL)>0)*(VAL))

# Clamp between 0 and 1
%define CLAMP_0_1(VAL) (1 - (((VAL)<1) * (1-POSITIVE_CLAMP(VAL))) )

# random float
%define RANDOM_0_1() random("0.0", "1.0")

%define AVERAGE(A,B) (((A)+(B))/2)

# lerp
%define LERP(OUT0,OUT1,T) ((OUT0)+(T)*((OUT1)-(OUT0)))

# opposite of lerp. Gets t from a value.
%define UNLERP(IN0,IN1,VAL) (((VAL)-(IN0))/((IN1)-(IN0)))

# map a value from input range to output range.
%define REMAP(IN0,IN1,OUT0,OUT1,T) (LERP(OUT0,OUT1,UNLERP(IN0,IN1,T)))


### Specific to this project:

# sRGB to linear Rec.709 (not piecewise)
%define TO_LINEAR(VAL) ROOT(VAL, 2.2)

# linear Rec.709 to sRGB (not piecewise)
%define FROM_LINEAR(VAL) POW(VAL, 2.2)

# Convert 2D coordinates into index, assumes ints that do not wrap
%define INDEX_FROM_2D_NOWRAP_INTS(X,Y,SIZE_X) (1 + (((SIZE_X)*(Y)) + (X)))

%define INDEX_FROM_2D_INTS(X,Y,SIZE_X,SIZE_Y) (1 + (((SIZE_X)*((Y)%(SIZE_Y))) + ((X)%(SIZE_X))))

# Convert 3D coordinates into index, wrapping along all axes. Remember that lists are 1-indexed.
%define INDEX_FROM_3D(X,Y,Z,SIZE_X,SIZE_Y,SIZE_Z) (1 + ((((SIZE_X)*(SIZE_Y)) * (floor(Z) % (SIZE_Z))) + (((SIZE_X)*(floor(Y) % (SIZE_Y))) + (floor(X) % (SIZE_X)))))

# Same as INDEX_FROM_3D but for the canvas, which only wraps along X and Y.
%define INDEX_FROM_3D_CANVAS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * floor(Z)) + (((SIZE_X)*(floor(Y) % (SIZE_Y))) + (floor(X) % (SIZE_X)))))

# same as INDEX_FROM_3D_CANVAS but assumes ints
%define INDEX_FROM_3D_CANVAS_INTS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * (Z)) + (((SIZE_X)*((Y) % (SIZE_Y))) + ((X) % (SIZE_X)))))

# Special case index, assumes ints that do not wrap
%define INDEX_FROM_3D_NOWRAP_INTS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * (Z)) + (((SIZE_X)*(Y)) + (X))))


# HSV to RGB transformation
# https://stackoverflow.com/questions/3018313/algorithm-to-convert-rgb-to-hsv-and-hsv-to-rgb-in-range-0-255-for-both
func HSV_to_RGB(h, s, v) RGB {
    local hue = ($h % 1)*6; # [0,6)
    local sat = CLAMP_0_1($s); # [0,1]
    local val = POSITIVE_CLAMP($v); # [0,+Inf)
    if (hue < 3) {
        if (hue < 1) {
            return RGB { r:val, g:val*(1-(sat*(1-(hue%1)))), b:val*(1-sat) };
        } elif (hue < 2) {
            return RGB { r:val*(1-(sat*(hue%1))), g:val, b:val*(1-sat) };
        } else {
            return RGB { r:val*(1-sat), g:val, b:val*(1-(sat*(1-(hue%1)))) };
        }
    } else {
        if (hue < 4) {
            return RGB { r:val*(1-sat), g:val*(1-(sat*(hue%1))), b:val };
        } elif (hue < 5) {
            return RGB { r:val*(1-(sat*(1-(hue%1)))), g:val*(1-sat), b:val };
        } else {
            return RGB { r:val, g:val*(1-sat), b:val*(1-(sat*(hue%1))) };
        }
    }
}


################################
#             Misc             #
################################

# assumes the value is stored at the 3rd item

# returns value for use in variable
func get_setting_from_id(element_id) {
    local element_index = $element_id in UI_data_element_id;
    if (element_index == 0) { error "element id doesn't exist: " & $element_id; }
    return UI_data[UI_data_element_index[element_index]+3]; # return
}

# adds to shared list
proc setting_from_id element_id {
    local element_index = $element_id in UI_data_element_id;
    if (element_index == 0) { error "element id doesn't exist: " & $element_id; }
    add UI_data[UI_data_element_index[element_index]+3] to UI_return;
}

proc setting_col_from_id element_id {
    local element_index = $element_id in UI_data_element_id;
    if (element_index == 0) { error "element id doesn't exist: " & $element_id; }
    local col = UI_data[UI_data_element_index[element_index]+3];
    add ROOT((col//65536)%256/255, 2.2) to UI_return;
    add ROOT((col//256)%256/255, 2.2) to UI_return;
    add ROOT(col%256/255, 2.2) to UI_return;
}

proc set_setting_from_id element_id, value {
    local element_index = $element_id in UI_data_element_id;
    if (element_index == 0) { 
        error "element id doesn't exist: " & $element_id; 
    } else {
        UI_data[UI_data_element_index[element_index]+3] = $value;
    }
}

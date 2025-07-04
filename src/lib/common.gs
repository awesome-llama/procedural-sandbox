# Common library of miscellaneous items for all sprites in this project.
# Not a valid sprite by iself.

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

# empty colorless air, no parameters
%define VOXEL_NONE voxel { opacity:0, r:0, g:0, b:0, emission:0 }

# ARGB(1/255,0,0,0) is the most transparent color able to be drawn with pen
%define COL_TRANSPARENT() 16777216;

# generic 3D point
struct XYZ {
    x,
    y,
    z
}

# HSV channels
struct HSV {
    h,
    s,
    v
}

enum CompositorMode {
    NONE = "",
    COLOR = "COLOR", # RGB & Alpha only
    SHADED = "SHADED", # fully processed color
    PATHTRACED = "PATHTRACED", # realistic rendering
    HEIGHT = "HEIGHT", # heightmap, topmost voxel elevation
    AO = "AO", # ambient occlusion
    NORMAL = "NORMAL" # heightmap converted to normal map
}

enum ViewportMode {
    ALIGNED = "ALIGNED", # axis-aligned top-down view
    ORBIT = "ORBIT" # 3D renderer
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


# Random numbers

%define RANDOM_X() random(0, canvas_size_x-1)

%define RANDOM_Y() random(0, canvas_size_y-1)

%define RANDOM_Z() random(0, canvas_size_z-1)

%define RANDOM_0_1() random("0.0", "1.0")

%define RANDOM_ANGLE() random("0.0", "360.0")

%define PROBABILITY(P) (RANDOM_0_1() < (P))

################################
#             Math             #
################################

# Get the sign of a number. 1 if positive, -1 if negative. NaN if 0.
%define SIGN(VAL) ((VAL)/abs(VAL))

# Power
%define POW(BASE,EXP) antiln(ln(BASE)*(EXP))

# nth root
%define ROOT(BASE,N) antiln(ln(BASE)/(N))

# Logarithm of any base
%define LOG(VAL,BASE) (ln(VAL)/ln(BASE))


# Smallest of 2 numbers
%define MIN(A,B) ((A)+(((A)>(B))*((B)-(A))))

# Largest of 2 numbers
%define MAX(A,B) ((A)+(((A)<(B))*((B)-(A))))


# Clamp, keep numbers above 0
%define POSITIVE_CLAMP(VAL) (((VAL)>0)*(VAL))

# Clamp between 0 and 1
%define CLAMP_0_1(VAL) (1 - (((VAL)<1) * (1-POSITIVE_CLAMP(VAL))) )

# Clamp between any two values
%define CLAMP(MIN,MAX,VAL) ((MAX) - (((MAX) - ((((VAL) - (MIN)) * ((VAL) > (MIN))) + (MIN))) * ((VAL) < (MAX))))


# Arithmetic mean ("average") of 2 numbers
%define MEAN(A,B) (((A)+(B))/2)

# Linear interpolation ("lerp"). Remap a normalised value `t` (between 0 and 1) to a different interval.
%define LERP(OUT0,OUT1,T) ((OUT0)+(T)*((OUT1)-(OUT0)))

# opposite of lerp. Gets t from a value.
%define UNLERP(IN0,IN1,VAL) (((VAL)-(IN0))/((IN1)-(IN0)))

# Remap a value from input interval to output interval.
%define REMAP(IN0,IN1,OUT0,OUT1,T) (LERP(OUT0,OUT1,UNLERP(IN0,IN1,T)))


# Length of a 2D vector
%define VEC2_LEN(VX,VY) sqrt((VX)*(VX) + (VY)*(VY))

# Length of a 3D vector
%define VEC3_LEN(VX,VY,VZ) sqrt((VX)*(VX) + (VY)*(VY) + (VZ)*(VZ))

# Vector angle in the XY plane. Note the addition of 0, used to fix a negative zero bug.
%define ATAN2(Y,X) (atan((Y)/((X)+0)) + 180*((X)<0))

# Dot product 2D
%define DOT_PRODUCT_2D(X1,Y1,X2,Y2) ((X1)*(X2) + (Y1)*(Y2))

# Dot product 3D
%define DOT_PRODUCT_3D(X1,Y1,Z1,X2,Y2,Z2) ((X1)*(X2) + (Y1)*(Y2) + (Z1)*(Z2))


# Approximately equal to
%define APPROX(A,B,TOLERANCE) (abs((B)-(A)) < (TOLERANCE))


### Specific to this project:

# Floored RGB channels to integer
%define COMBINE_RGB_CHANNELS(R,G,B) (65536*floor(255*(R)) + 256*floor(255*(G)) + floor(255*(B)))

# sRGB to linear Rec.709 (not piecewise)
%define TO_LINEAR(VAL) POW(VAL, 2.2)

# Linear Rec.709 to sRGB (not piecewise)
%define FROM_LINEAR(VAL) ROOT(VAL, 2.2)

# Convert 2D coordinates into list index, assumes ints that do not wrap
%define INDEX_FROM_2D_NOWRAP_INTS(X,Y,SIZE_X) (1 + (((SIZE_X)*(Y)) + (X)))

# Convert 2D coordinates into list index, assumes ints, wrapped
%define INDEX_FROM_2D_INTS(X,Y,SIZE_X,SIZE_Y) (1 + (((SIZE_X)*((Y)%(SIZE_Y))) + ((X)%(SIZE_X))))

# Convert 2D coordinates into list index, floored and wrapped
%define INDEX_FROM_2D(X,Y,SIZE_X,SIZE_Y) (1 + (((SIZE_X)*(floor(Y)%(SIZE_Y))) + (floor(X)%(SIZE_X))))

# Convert 3D coordinates into list index, wrapping along all axes. Remember that lists are 1-indexed.
%define INDEX_FROM_3D(X,Y,Z,SIZE_X,SIZE_Y,SIZE_Z) (1 + ((((SIZE_X)*(SIZE_Y)) * (floor(Z) % (SIZE_Z))) + (((SIZE_X)*(floor(Y) % (SIZE_Y))) + (floor(X) % (SIZE_X)))))

# Same as INDEX_FROM_3D but for the canvas, which only wraps along X and Y.
%define INDEX_FROM_3D_CANVAS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * floor(Z)) + (((SIZE_X)*(floor(Y) % (SIZE_Y))) + (floor(X) % (SIZE_X)))))

# same as INDEX_FROM_3D_CANVAS but assumes ints
%define INDEX_FROM_3D_CANVAS_INTS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * (Z)) + (((SIZE_X)*((Y) % (SIZE_Y))) + ((X) % (SIZE_X)))))

# Special case list index, assumes ints that do not wrap
%define INDEX_FROM_3D_NOWRAP_INTS(X,Y,Z,SIZE_X,SIZE_Y) (1 + ((((SIZE_X)*(SIZE_Y)) * (Z)) + (((SIZE_X)*(Y)) + (X))))


# HSV to RGB transformation
# https://stackoverflow.com/questions/3018313/algorithm-to-convert-rgb-to-hsv-and-hsv-to-rgb-in-range-0-255-for-both
func HSV_to_RGB(h, s, v) RGB {
    local hue = ($h % 1)*6; # [0,6)
    local sat = CLAMP_0_1($s); # [0,1]
    local val = CLAMP_0_1($v); # [0,1]
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

# HSV to RGB base 10 number 0-16777215
func HSV_to_number(h, s, v) {
    local hue = ($h % 1)*6; # [0,6)
    local sat = CLAMP_0_1($s); # [0,1]
    local val = CLAMP_0_1($v); # [0,1]
    if (hue < 3) {
        if (hue < 1) {
            return COMBINE_RGB_CHANNELS(val, val*(1-(sat*(1-(hue%1)))), val*(1-sat));
        } elif (hue < 2) {
            return COMBINE_RGB_CHANNELS(val*(1-(sat*(hue%1))), val, val*(1-sat));
        } else {
            return COMBINE_RGB_CHANNELS(val*(1-sat), val, val*(1-(sat*(1-(hue%1)))));
        }
    } else {
        if (hue < 4) {
            return COMBINE_RGB_CHANNELS(val*(1-sat), val*(1-(sat*(hue%1))), val);
        } elif (hue < 5) {
            return COMBINE_RGB_CHANNELS(val*(1-(sat*(1-(hue%1)))), val*(1-sat), val);
        } else {
            return COMBINE_RGB_CHANNELS(val, val*(1-sat), val*(1-(sat*(hue%1))));
        }
    }
}


# RGB to HSV
# https://math.stackexchange.com/questions/556341/rgb-to-hsv-color-conversion-algorithm
func RGB_to_HSV(r, g, b) HSV {
    if ($r < $b) {
        if ($r < $g) {
            if ($g < $b) {
                local minc = $r;
                local maxc = $b;
            } else {
                local minc = $r;
                local maxc = $g;
            }
        } else {
            local minc = $g;
            local maxc = $b;
        }
    } else {
        if ($g < $b) {
            local minc = $g;
            local maxc = $r;
        } else {
            if ($r < $g) {
                local minc = $b;
                local maxc = $g;
            } else {
                local minc = $b;
                local maxc = $r;
            }
        }
    }
    
    if (minc == maxc) {
        return HSV { h:0, s:0, v:maxc }; # greyscale
    }
    
    local rc = (maxc-$r) / (maxc-minc);
    local gc = (maxc-$g) / (maxc-minc);
    local bc = (maxc-$b) / (maxc-minc);
    if ($r == maxc) {
        local h = bc-gc;
    } elif ($g == maxc) {
        local h = 2+rc-bc;
    } else {
        local h = 4+gc-rc;
    }
    return HSV { h:((h/6)%1), s:((maxc-minc)/maxc), v:maxc };
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
    add (col//65536)%256/255 to UI_return;
    add (col//256)%256/255 to UI_return;
    add col%256/255 to UI_return;
}

proc set_setting_from_id element_id, value {
    local element_index = $element_id in UI_data_element_id;
    if (element_index == 0) { 
        error "element id doesn't exist: " & $element_id; 
    } else {
        UI_data[UI_data_element_index[element_index]+3] = $value;
    }
}


func RGB_num_to_hex_code(col) {
    return (hex_lookup[($col//65536)%256 + 1] & hex_lookup[($col//256)%256 + 1] & hex_lookup[$col%256 + 1]);
}


# print a message to the project_messages list
proc print text, duration {
    add $text to project_messages;
    if $duration == "" {
        add 5 to project_messages;
    } else {
        add $duration to project_messages;
    }
}


# print a message to the project_messages list, only if the previous message is different
proc print_no_duplicates text, duration {
    if (project_messages[length project_messages - 1] == $text) {
        project_messages[length project_messages] = $duration;
    } else {
        add $text to project_messages;
        if $duration == "" {
            add 5 to project_messages;
        } else {
            add $duration to project_messages;
        }
    }
}




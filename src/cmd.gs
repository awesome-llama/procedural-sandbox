%include lib/common

costumes "costumes/cmd/icon.svg" as "icon";
hide;

list command_split;

on "initalise" {
    hide;
    switch_costume "icon";
    delete command_split;
}

on "sys.hard_reset" {
    delete command_split;
    cmd_string = "";
}

onkey "/" {
    broadcast "sys.open_commands";
}

##################################

proc _read_command_until_semicolon {
    # split a single command into its components
    delete command_split;
    local inside_quotes = 0;
    local substring = "";
    # ignore preceding spaces and slashes
    until not ("/" in cmd_string[i]) {
        i += 1;
        if i > length(cmd_string) {
            stop_this_script;
        }
    }
    until i > length(cmd_string) {
        if (inside_quotes == 1 and cmd_string[i] == "\\") {
            # escaped within a string, always read next value as text
            str &= cmd_string[i+1];
            i += 2;
        } else {
            if (cmd_string[i] == "\"") {
                inside_quotes = 1 - inside_quotes; 
            } elif (inside_quotes == 0 and cmd_string[i] == " ") {
                add substring to command_split;
                substring = "";
            } elif (inside_quotes == 0 and cmd_string[i] == ";") {
                add substring to command_split;
                substring = "";
                stop_this_script; # end of command, break so it can be run
            } else {
                substring &= cmd_string[i];
            }
            i += 1;
        }
    } 
    add substring to command_split;
    substring = ""; # clear data, no longer needed
}



%define ARG_1 command_split[1]
%define ARG_2 command_split[2]
%define ARG_3 command_split[3]
%define ARG_4 command_split[4]


nowarp proc evaluate_command {
    # evaluate the command stored in the command list
    local command_name = command_split[1];
    if (command_name[1] == "#") {
        stop_this_script;
    }
    delete command_split[1]; # remove command name, leaving the list of arguments
    
    #if (command_name == "dev") {
    #    dev = ARG_1;
    #    print "dev=" & dev, 4;
    #    stop_this_script;
    #} 

    if (command_name == "reset") {
        broadcast "sys.reset";
    }
    
    #if dev != 1 { # no developer mode in this project. # buttons also may trigger the command.
    #    print "dev=1 required", 4;
    #    stop_this_script;
    #}
    
    if (command_name == "help") {
        print "look inside the project, `cmd` sprite", 4;

    } elif (command_name == "print") {
        print ARG_1, ARG_2;

    } elif (command_name == "wait") {
        wait ARG_1;

    } elif (command_name == "broadcast" or command_name == "run") {
        broadcast ARG_1; # run any broadcast block

    } elif (command_name == "panel" or command_name == "page" or command_name == "p") {
        delete UI_popup;
        UI_current_panel = ARG_1;
    
    } elif (command_name == "compositor") {
        delete UI_popup;
        compositor_mode = ARG_1;
        require_composite = true;

    } elif (command_name == "composite") {
        require_composite = ARG_1;
    
    } elif (command_name == "refresh") {
        require_viewport_refresh = ARG_1;
    
    } elif (command_name == "export") {
        if (ARG_1 == "canvas") { broadcast "io.save_canvas.run"; }
        if (ARG_1 == "render") { broadcast "io.export_rendered_canvas.run"; }
        if (ARG_1 == "height") { broadcast "io.export_height_map.run"; }

    }  elif (command_name == "element") {
        # set any element in the UI. Arguments: string_id, index_offset, value_to_set
        local element_index = ARG_1 in UI_data_element_id;
        if (element_index == 0) { 
            error "element id doesn't exist: " & element_index;
        } else {
            UI_data[UI_data_element_index[element_index]+ARG_2] = ARG_3;
        }

    } elif (command_name == "close") {
        if (ARG_1 == "popup") {
            delete UI_popup;
            require_viewport_refresh = true;
        } elif (ARG_1 == "list") {
            broadcast "sys.hide_lists";
        }

    } else {
        print "Unrecognised command: `" & command_name & "`", 4;

    }
}


on "sys.open_commands" {
    broadcast "sys.hide_lists";
    hide;
    switch_costume "icon";
    stop_other_scripts;
    ask "(DEV TOOLS) enter command:";
    if (answer() != "") {
        cmd_string = answer();
        broadcast "sys.run_command";
    }
}


# run the command given in cmd_string
on "sys.run_command" {
    if (cmd_string != "") {
        i = 1;
        until (i >= length(cmd_string)) {
            _read_command_until_semicolon;
            evaluate_command;
            i += 1;
        }
    }
}

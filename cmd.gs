costumes "costumes/cmd/icon.svg" as "icon", "costumes/cmd/dev.svg" as "dev";

list args = [];
list command = [];



on "! initalise" {
    hide;
    switch_costume "icon";
    delete command;
}


onkey "/" {
    broadcast "open commands";
}

# PSB specific

onkey "i" {
    stop_other_scripts;
    ask "paste heightmap";
    if (not (answer() == "")) {
        TextImage = answer();
        broadcast_and_wait "import as heightmap";
        broadcast "composite";
    }
}

onkey "j" {
    stop_other_scripts;
    ask "paste 2D colmap";
    if (not (answer() == "")) {
        TextImage = answer();
        broadcast_and_wait "import as color map";
        broadcast "composite";
    }
}

##################################

proc _read_command_until_semicolon {
    # split a single command into its components
    delete command;
    inside_quotes = 0;
    substring = "";
    # ignore preceding spaces and slashes
    until not ("/" in cmd_string[i]) {
        i += 1;
        if i > length(cmd_string) {
            stop_this_script;
        }
    }
    until i > length(cmd_string) {
        if inside_quotes == 1 and cmd_string[i] == "\\" {
            # escaped within a string, always read next value as text
            str &= cmd_string[i+1];
            i += 2;
        } else {
            if cmd_string[i] == "\"" {
                inside_quotes = 1 - inside_quotes; 
            } elif inside_quotes == 0 and cmd_string[i] == " " {
                add substring to command;
                substring = "";
            } elif inside_quotes == 0 and cmd_string[i] == ";" {
                add substring to command;
                substring = "";
                stop_this_script; # end of command, break so it can be run
            } else {
                substring &= cmd_string[i];
            }
            i += 1;
        }
    } 
    add substring to command;
    substring = "";
}



proc evaluate_command {
    # evaluate the command stored in the command list
    command_name = command[1];
    if command_name[1] == "#" {
        stop_this_script;
    }
    delete command[1];
    
    if command_name == "dev" {
        dev = command[1];
        print "dev=" & dev, 4;
        stop_this_script;
    } 

    if command_name == "reset" {
        broadcast "reset";
        stop_all;
    }
    
    if dev != 1 {
        print "dev=1 required", 4;
        stop_this_script;
    }
    
    if command_name == "help" {
        print "look inside the project, `cmd` sprite", 4;

    } elif (command_name == "export") {

        if (args[1] == "canvas") {
            broadcast "export canvas";
        } elif (args[1] == "render") {
            broadcast "export render";
        } else {}
        
    } elif (command_name == "size") {
        
        if (args[1] == "x") {
            canvas_size_x = args[2];
        } elif (args[1] == "y") {
            canvas_size_y = args[2];
        } elif (args[1] == "z") {
            canvas_size_z = args[2];
        } else {
            canvas_size_x = args[1];
            canvas_size_y = args[2];
            canvas_size_z = args[3];
        }
        broadcast "composite";

    } elif (command_name == "clear") {
        broadcast "clear canvas";
        broadcast "zoom extents";
        broadcast "composite";

    } else {
        print "Unrecognised command: `" & command_name & "`", 4;

    }
}


# print a message to the project_messages list
proc print text, duration {
    # to be displayed with a text engine
    add $text to project_messages;
    if $duration == "" {
        add 4 to project_messages;
    } else {
        add $duration to project_messages;
    }
}


on "open commands" {
    hide;
    switch_costume "icon";
    stop_other_scripts;
    ask "(DEV TOOLS) enter command:";
    if answer() != "" {
        cmd_string = answer();
        i = 1;
        until i >= length(cmd_string) {
            _read_command_until_semicolon;
            evaluate_command;
            i += 1;
        }
    }
}


on "update cmd messages" {update_cmd_messages;}
proc update_cmd_messages {
    # update list of messages, not for rendering them
    msg_i = 1;
    repeat (length project_messages) / 2 {
        project_messages[msg_i+1] -= 0.033; # replace this with delta time
        if project_messages[msg_i+1] < 0 {
            # delete message:
            delete project_messages[msg_i];
            delete project_messages[msg_i];
        } else {
            msg_i += 2;
        }
    }
}


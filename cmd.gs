%include common/common.gs

costumes "costumes/cmd/icon.svg" as "icon", "costumes/cmd/dev.svg" as "dev";
hide;

list command;

on "initalise" {
    hide;
    switch_costume "icon";
    delete command;
}

on "hard reset" {
    delete command;
}

onkey "/" {
    broadcast "open commands";
}

##################################

proc _read_command_until_semicolon {
    # split a single command into its components
    delete command;
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
    substring = ""; # clear data, no longer needed
}



proc evaluate_command {
    # evaluate the command stored in the command list
    local command_name = command[1];
    if (command_name[1] == "#") {
        stop_this_script;
    }
    delete command[1]; # remove command name, leaving the list of arguments
    
    if (command_name == "dev") {
        dev = command[1];
        print "dev=" & dev, 4;
        stop_this_script;
    } 

    if (command_name == "reset") {
        broadcast "reset";
        stop_all;
    }
    
    if dev != 1 {
        print "dev=1 required", 4;
        stop_this_script;
    }
    
    if (command_name == "help") {
        print "look inside the project, `cmd` sprite", 4;

    } elif (command_name == "wait") {
        wait command[1];

    } elif (command_name == "broadcast" or command_name == "run") {
        broadcast command[1]; # run any broadcast block

    } elif (command_name == "panel" or command_name == "page" or command_name == "p") {
        UI_current_panel = command[1];
    
    } elif (command_name == "element") {
        # set any element in the UI. Arguments: string_id, index_offset, value_to_set
        local element_index = command[1] in UI_data_element_id;
        if (element_index == 0) { 
            error "element id doesn't exist: " & element_index;
        } else {
            UI_data[UI_data_element_index[element_index]+command[2]] = command[3];
        }

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
    if (answer() != "") {
        cmd_string = answer();
        broadcast "run command";
    }
}


# run the command given in cmd_string
on "run command" {
    if cmd_string != "" {
        i = 1;
        until i >= length(cmd_string) {
            _read_command_until_semicolon;
            evaluate_command;
            i += 1;
        }
    }
}


on "update cmd messages" { update_cmd_messages; }
proc update_cmd_messages {
    # update list of messages, not for rendering them
    local msg_i = 1;
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


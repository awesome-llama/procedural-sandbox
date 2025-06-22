# THUMBNAIL SPRITE

costumes "costumes/blank.svg" as "awesome-llama";


on "initalise" {
    hide;
    goto 0, 0;
}

on "sys.reset" {
    log "run this script to reset the project for sharing";
    broadcast_and_wait "initalise"; # wait is required to ensure everything is done for the frame
    broadcast "sys.hard_reset";
    switch_costume "awesome-llama";
    show;
    stop_all;
}


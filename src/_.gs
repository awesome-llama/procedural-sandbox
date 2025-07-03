# THUMBNAIL SPRITE

costumes "costumes/thumbnail.png" as "awesome-llama", "costumes/blank.svg" as "blank";


on "initalise" {
    hide;
    goto 0, 0;
    switch_costume "blank";
}

on "sys.reset" {
    log "run this script to reset the project for sharing";
    erase_all;
    broadcast_and_wait "initalise"; # wait is required to ensure everything is done for the frame
    broadcast "sys.hard_reset";
    switch_costume "awesome-llama";
    show;
    stop_all;
}


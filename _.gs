# THUMBNAIL SPRITE

costumes "costumes/blank.svg" as "awesome-llama";


on "initalise" {
    hide;
    goto 0, 0;
}

on "*" {
    log "run this script to reset the project for sharing";
    broadcast "initalise";
    broadcast_and_wait "hard reset";
    switch_costume "awesome-llama";
    show;
    stop_all;
}


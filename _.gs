# THUMBNAIL SPRITE

costumes "costumes/blank.svg" as "awesome-llama";


on "initalise" {
    hide;
    goto 0, 0;
}

on "*" {
    broadcast_and_wait "hard reset"; # todo make a better reset system, separate by temp data (resets on flag) and long term data
    switch_costume "awesome-llama";
    show;
    stop_all;
}


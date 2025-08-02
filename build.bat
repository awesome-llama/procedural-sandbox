@echo off

:: data URLs
echo Generating list data for data URLs...
python3 "src/data_URL/process.py"

:: UI
echo Generating list data for UI...
python3 "src/UI/UI_creator.py"

:: Build the goboscript project
goboscript build src -o "Procedural Sandbox goboscript.sb3"

:: post-processing
echo Running post-process...
python3 "src/post-processing/main.py"

echo Finished!
pause
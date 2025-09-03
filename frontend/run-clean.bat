@echo off
setlocal

:: Check if we are in the React Native root directory
if not exist android (
  echo Error: No "android" folder found. Please run this script from the React Native project root.
  exit /b 1
)

if not exist package.json (
  echo Error: No "package.json" found. Please run this script from the React Native project root.
  exit /b 1
)

echo Cleaning Android build...
cd android
gradlew clean

echo Going back to project root...
cd ..

echo Running app on Android...
npx react-native run-android

endlocal
pause

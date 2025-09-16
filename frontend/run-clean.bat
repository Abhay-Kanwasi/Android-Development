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
gradlew build

echo Removing native build cache...
rmdir /s /q .cxx
rmdir /s /q app\build
cd ..

echo Reinstalling node modules...
rmdir /s /q node_modules
del package-lock.json
call npm install

echo Removing generated bad autolinking cmake...
del /q android\app\build\generated\autolinking\src\main\jni\Android-autolinking.cmake

echo Running app on Android...
npx react-native run-android

echo Running android on AndroidStudio
npm run android

endlocal
pause

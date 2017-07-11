VoiceCode command package for the Visual Studio Code editor.

## Configuration

To make everything work, change the following setting in VSCode:

```"editor.emptySelectionClipboard": false```

# Features

This package exposes two new api methods that interact with VSCode:

- executeVSCodeCommand : (command: String, options: Any) => Any

Executes a VSCode command remotely.

- executeVSCodeExposedMethod : (method: String, options: Any) => Any

Executes a VSCode exposed method, found in the VSCode extension (https://github.com/VoiceCode/vscode-voicecode)

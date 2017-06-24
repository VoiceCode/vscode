const remote = require('./remote_vs');

const pack = Packages.register({
  name: 'vscode',
  applications: ['com.microsoft.VSCode'],
  description: 'VSCode IDE integration'
});

pack.api({
  'executeVSCodeCommand': {
    description: 'execute VSCode command remotely',
    signature: 'executeVSCodeCommand : (command: String, options: Any) => Any',
    action: (command, options) => {
      const times = _.get(options, 'times', 1);
      const params = _.get(options, 'params', []);
      remote.call({
        method: 'executeCommand',
        params: {
          command,
          params,
          times
        }
      });
    }
  },
  'executeVSCodeExposedMethod': {
    description: 'Invoke remote VSCode method',
    signature: 'executeVSCodeExposedMethod : (method: String, options: Any) => Any',
    action: (method, options) => {
      remote.call({
        method,
        params: {
          options
        }
      })
    }
  }
});

pack.commands({
  'navigateCursorBack': {
    spoken: 'cursor back',
    continuous: false,
    description: 'move the cursor to the previous position in history',
    action: function () {
      this.executeVSCodeCommand('workbench.action.navigateBack');
    }
  },
  'navigateCursorForward': {
    spoken: 'cursor next',
    continuous: false,
    description: 'move the cursor to the next position in history',
    action: function () {
      this.executeVSCodeCommand('workbench.action.navigateForward');
    }
  }
})

pack.implement({
  scope: 'vscode',
}, {
    'os:redo': function () {
      this.executeVSCodeCommand('redo');
    },
    'os:undo': function () {
      this.executeVSCodeCommand('undo');
    },
    'delete:partial-word': function () {
      this.key('delete', 'option');
    },
    'delete:partial-word-forward': function () {
      this.key('d', 'option');
    },
    'delete:way-right': function () {
      this.executeVSCodeCommand('deleteAllRight');
    },
    'delete:way-left': function () {
      this.executeVSCodeCommand('deleteAllLeft');
    },
    'cursor:new-line-below': function () {
      this.executeVSCodeCommand('editor.action.insertLineAfter');
    },
    'cursor:new-line-above': function () {
      this.executeVSCodeCommand('editor.action.insertLineBefore');
    },
    'editor:move-to-line-number': function (input) {
      let lineNumber = null;
      try {
        lineNumber = parseInt(input);
      } catch (e) {
        lineNumber = null;
      }

      if (lineNumber) {
        this.executeVSCodeExposedMethod('moveCursorToLine', { line: lineNumber });
      } else {
        this.key('g', 'control');
      }
    },
    'editor:insert-code-template': function ({ codesnippet }) {
      if (codesnippet) {
        this.executeVSCodeCommand('editor.action.showSnippets');
        this.delay(200);
        this.string(codesnippet);
        this.key('enter');
      }
    },
    'selection:block': function () {
      this.executeVSCodeCommand('editor.action.smartSelect.grow');
    },
    'editor:move-to-line-number-and-way-left': function (input) {
      let lineNumber = null;
      try {
        lineNumber = parseInt(input);
      } catch (e) {
        lineNumber = null;
      }

      if (lineNumber) {
        this.executeVSCodeExposedMethod('moveCursorToLine', { line: lineNumber });
      } else {
        this.key('g', 'control');
      }
    },
    'editor:move-to-line-number-and-way-right': function (input) {
      let lineNumber = null;
      try {
        lineNumber = parseInt(input);
      } catch (e) {
        lineNumber = null;
      }

      if (lineNumber) {
        this.executeVSCodeExposedMethod('moveCursorToLine', { line: lineNumber, cursorEnd: true });
      } else {
        this.key('g', 'control');
      }
    },
    'editor:insert-under-line-number': true,
    'editor:select-line-number': function (input) {
      let lineNumber = null;
      try {
        lineNumber = parseInt(input);
      } catch (e) {
        lineNumber = null;
      }

      if (lineNumber) {
        this.do('editor:move-to-line-number', lineNumber);
        this.delay(40);
      }
      this.do('selection:current-line');
    },
    'object:duplicate': function () {
      this.executeVSCodeCommand('editor.action.copyLinesDownAction');
    },
    'selection:current-line': function () {
      this.executeVSCodeExposedMethod('selectLines');
    },
    'delete:lines': function () {
      const { first, last } = arguments[0] || {};

      this.executeVSCodeExposedMethod('selectLines', { from: first, to: last });
      this.delay(40);
      this.key('delete');
    },
    'selection:previous-selection-occurrence': function () {
      this.executeVSCodeCommand('editor.action.previousSelectionMatchFindAction');
    },
    'selection:next-selection-occurrence': function () {
      this.executeVSCodeCommand('editor.action.nextSelectionMatchFindAction');
    },
    'editor:select-line-number-range': function (input) {
      if (input) {
        number = input.toString();
        length = Math.floor(number.length / 2);
        first = number.substr(0, length);
        last = number.substr(length, length + 1);
        first = parseInt(first);
        last = parseInt(last);
        if (last < first) {
          temp = last;
          last = first;
          first = temp;
        }
        this.executeVSCodeExposedMethod('selectLines', { from: first, to: last });
      }
    },
    'editor:toggle-comments': function () {
      const { first, last } = arguments[0] || {};

      this.executeVSCodeExposedMethod('selectLines', { from: first, to: last });
      this.delay(40);
      this.executeVSCodeCommand('editor.action.commentLine');
    },
    'editor:expand-selection-to-scope': function () {
      this.executeVSCodeExposedMethod('expandSelectionToScope');
    },
    'editor:click-expand-selection-to-scope': true,
    'editor:extend-selection-to-line-number': function (input) {
      let lineNumber = null;
      try {
        lineNumber = parseInt(input);
      } catch (e) {
        lineNumber = null;
      }

      if (lineNumber) {
        this.executeVSCodeExposedMethod('selectLines', { to: lineNumber });
      }
    },
    'editor:insert-from-line-number': function (input) {
      let lineNumber = null;
      try {
        lineNumber = parseInt(input);
      } catch (e) {
        lineNumber = null;
      }

      if (lineNumber) {
        this.executeVSCodeExposedMethod('insertFromLine', { line: lineNumber });
      }
    },
    'selection:previous-word-by-surrounding-characters': function (input) {
      if (!input || !input.value || input.value.length != 2) {
        return;
      }
      const first = input.value[0];
      const last = input.value[1];

      this.executeVSCodeExposedMethod('selectBySurroundingCharacters', { first, last });
    },
    'selection:next-word-by-surrounding-characters': function (input) {
      if (!input || !input.value || input.value.length != 2) {
        return;
      }
      const first = input.value[0];
      const last = input.value[1];

      this.executeVSCodeExposedMethod('selectBySurroundingCharacters', { first, last, nextWord: true });
    },
    'selection:next-word': function(){
      this.executeVSCodeExposedMethod('selectNextWord');
    },
    'selection:previous-word': function(){
      this.executeVSCodeExposedMethod('selectNextWord', { backwards: true});      
    }
  });

pack.commands({
  'file-finder': {
    spoken: 'fopen',
    description: 'open file finder window in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.action.quickOpen');
    }
  },
  'show-sidebar': {
    spoken: 'code sidebar',
    description: 'open sidebar in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.action.toggleSidebarVisibility');
    }
  },
  'show-explorer': {
    spoken: 'code explorer',
    description: 'open explorer in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.view.explorer');
    }
  },
  'show-git': {
    spoken: 'code git',
    description: 'open git menu in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.view.git');
    }
  },
  'show-search': {
    spoken: 'code search',
    description: 'open search menu in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.view.search');
    }
  },
  'show-debug': {
    spoken: 'code debug',
    description: 'open debug menu in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.view.debug');
    }
  },
  'show-extensions': {
    spoken: 'code extensions',
    description: 'open extensions menu in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.view.extensions');
    }
  },
  'show-terminal': {
    spoken: 'code terminal',
    description: 'open terminal in vscode',
    continuous: false,
    action: function () {
      this.executeVSCodeCommand('workbench.action.terminal.toggleTerminal');
    }
  }
})



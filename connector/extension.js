import inspectSignal from './inspectSignal';

let onChangeCallback;
let hasInitialized = false;
let isInitializing = false;
let initialMessages = [];
let currentVersion = null;
let currentAppId = null;
let currentInitCallback = null;

const connector = {
  onChange(cb) {
    onChangeCallback = cb;
    initialMessages.forEach(cb);
    hasInitialized = true;
    isInitializing = false;
  },
  sendEvent(eventName, payload) {
    if (payload === undefined) {
      var src = 'var event = new Event("cerebral.dev.' + eventName + '");window.dispatchEvent(event);';
      chrome.devtools.inspectedWindow.eval(src, function(res, err) {
        if (err) {
          console.log(err);
        }
      });
    } else {
      var detail = {
        detail: payload
      };
      var src = 'var event = new CustomEvent("cerebral.dev.' + eventName + '", ' + JSON.stringify(detail) + ');window.dispatchEvent(event);';
      chrome.devtools.inspectedWindow.eval(src, function(res, err) {
        if (err) {
          console.log(err);
        }
      });
    }
  },
  inspect(signalName, actionPath) {
    var src = (
      '(' + inspectSignal.toString() + ')(window, "' + signalName + '", "' + actionPath + '")'
    );

    chrome.devtools.inspectedWindow.eval(src, function(res, err) {
      if (err) {
        console.log(err);
      }
    });
  },
  connect(initCallback, reset) {
    currentInitCallback = initCallback;
    const port = chrome.extension.connect({
        name: "Cerebral"
    });

    // Listen to messages from the background page
    port.onMessage.addListener((message) => {
      message = JSON.parse(message);
      var init = function () {
        initialMessages.push(message);

        if (isInitializing) {
          return;
        }
        isInitializing = true;
        currentVersion = message.version || 'v1';
        currentAppId = message.app;
        currentInitCallback(currentVersion);
      };

      if (hasInitialized) {
        if (
          ('app' in message && currentAppId !== message.app) ||
          (currentAppId && !message.app)
        ) {
          reset(message.type === 'init'); // Show debugger if init event
          if (message.type === 'init') {
            currentAppId = message.type === 'init' ? message.app : currentAppId;
            onChangeCallback(message);
          }
        } else {
          onChangeCallback(message);
        }

      } else if ('app' in message && message.type === 'init' || !('app' in message)) {
        init();
      }
    });

  }
};

export default connector;

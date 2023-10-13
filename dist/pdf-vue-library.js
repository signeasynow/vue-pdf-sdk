import { ref, onMounted, onUnmounted } from 'vue';

const useCreateIframeAndLoadViewer = ({
  files,
  fileName,
  licenseKey,
  uuid,
  tools,
  locale,
  mode,
  container,
  iframeSrc,
  onFileFailed
}) => {
  const internalIsReady = ref(false);
  const selectedPages = ref([]);
  const done = ref(false);
  const iframeLoadedSuccessfully = ref(false);
  const pagesLoaded = ref(null);

  const setInternalIsReady = (value) => {
    internalIsReady.value = value;
  };

  const setPagesLoaded = (value) => {
    pagesLoaded.value = value;
  };

  const setSelectedPages = (value) => {
    selectedPages.value = value;
  };

  const createIframe = () => {
    const iframe = document.createElement('iframe');

    iframe.src = iframeSrc || `/pdf-ui/index.html`;

    iframe.id = "webviewer-1";
    iframe.title = "webviewer";
    iframe.frameBorder = "0";
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.margin = "0px";
    iframe.style.padding = "0px";
    iframe.style.display = "block";

    iframe.allowFullscreen = true;
    // @ts-ignore
    iframe["webkitallowfullscreen"] = true;
    // @ts-ignore
    iframe["mozallowfullscreen"] = true;

    // When the iframe is loaded, post the file to it
    iframe.onload = function() {
      const targetOrigin = window.location.origin;
      const message = { files, fileName, tools, locale, licenseKey, mode, uuid };
    
      // Set up a function to send the message
      const sendMessage = () => {
        // @ts-ignore
        iframe.contentWindow.postMessage(message, targetOrigin);
      };
    
      // Call the function immediately to send the first message
      sendMessage();
    
      // Set up an interval to send the message every 1000ms (1 second)
      const interval = setInterval(sendMessage, 200);
    
      // Set up an event listener to listen for a response from the iframe
      window.parent.addEventListener('message', function(event) {
        if (event.data.type === 'file-received' && event.data.success) {
          // If the message was received successfully, clear the interval
          clearInterval(interval);
        }
        if (event.data.type === 'file-failed' && event.data.message) {
          // If the message was received successfully, clear the interval
          onFileFailed(event.data.message);
        }
        if (event.data.type === 'multi-page-selection-change' && Array.isArray(event.data.message)) {
          setSelectedPages(event.data.message);
        }
        if (event.data.type === "pages-loaded") {
          setPagesLoaded(event.data.message);
        }
      });
    };

    container.value.appendChild(iframe);
  };

  const handleIframeLoaded = (event) => {
    if (event.data.type === 'iframe-loaded' && event.data.success) {
      iframeLoadedSuccessfully.value = true;
      setInternalIsReady(true);
    }
  };

  onMounted(() => {
    console.log('onMounted called');
    window.parent.addEventListener('message', handleIframeLoaded);
  });

  onUnmounted(() => {
    window.parent.removeEventListener('message', handleIframeLoaded);
  });

  const handleVisibilityChange = () => {
    if (!document.hidden && !iframeLoadedSuccessfully.value) {
      const iframe = document.getElementById('webviewer-1');
      if (iframe) {
        iframe.remove();
      }
      createIframe();
    }
  };

  onMounted(() => {
    console.log(container, 'container');
    if (!container?.value) {
      return;
    }
    if (done.value) {
      return;
    }
    done.value = true;
    createIframe();

    document.addEventListener('click', function() {
      // @ts-ignore
      var iframeWin = document.getElementById('webviewer-1').contentWindow;
      iframeWin.postMessage('clickedOutside', window.location.origin);
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  const download = () => {
    var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    iframeWin.postMessage({ type: 'download' }, window.location.origin);
  };

  const toggleFullScreenThumbnails = (enable) => {
    var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    iframeWin.postMessage({ type: 'toggle-full-screen-thumbnails', enable }, window.location.origin);
  };

  const toggleSearchbar = (enable) => {
    // @ts-ignore
    var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    iframeWin.postMessage({ type: 'toggle-searchbar', enable }, window.location.origin);
  };

  const setThumbnailZoom = (value) => {
    // @ts-ignore
    var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    iframeWin.postMessage({ type: 'set-thumbnail-zoom', value }, window.location.origin);
  };

  const splitPages = async () => {
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.data.type === 'split-pages-completed' && event.data.success) {
          resolve(event.data.message);  // Resolve the promise with the result
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
        else if (event.data.type === 'split-pages-failed') {
          reject(new Error(event.data.message));  // Reject the promise with the error message
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
      };
  
      // Adding the event listener before sending the postMessage
      window.addEventListener('message', listener);
  
      // @ts-ignore
      var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    
      // Sending the extract-pages message to the iframe
      iframeWin.postMessage({ type: 'split-pages' }, window.location.origin);
    });
  };

  const mergeFiles = async (value) => {
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.data.type === 'merge-files-completed' && event.data.success) {
          resolve(event.data.message);  // Resolve the promise with the result
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
        else if (event.data.type === 'merge-files-failed') {
          reject(new Error(event.data.message));  // Reject the promise with the error message
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
      };
  
      // Adding the event listener before sending the postMessage
      window.addEventListener('message', listener);
  
      // @ts-ignore
      var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    
      // Sending the extract-pages message to the iframe
      iframeWin.postMessage({ type: 'merge-files', value }, window.location.origin);
    });
  };

  const removeChatHistory = async () => {
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.data.type === 'remove-chat-history-completed' && event.data.success) {
          resolve(event.data.message);  // Resolve the promise with the result
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
        else if (event.data.type === 'remove-chat-history-failed') {
          reject(new Error(event.data.message));  // Reject the promise with the error message
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
      };
  
      // Adding the event listener before sending the postMessage
      window.addEventListener('message', listener);
  
      // @ts-ignore
      var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    
      // Sending the extract-pages message to the iframe
      iframeWin.postMessage({ type: 'remove-chat-history' }, window.location.origin);
    });
  };

  const combineFiles = async (value) => {
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.data.type === 'combine-files-completed' && event.data.success) {
          resolve(event.data.message);  // Resolve the promise with the result
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
        else if (event.data.type === 'combine-files-failed') {
          reject(new Error(event.data.message));  // Reject the promise with the error message
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
      };
  
      // Adding the event listener before sending the postMessage
      window.addEventListener('message', listener);
  
      // @ts-ignore
      var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    
      // Sending the extract-pages message to the iframe
      iframeWin.postMessage({ type: 'combine-files', value }, window.location.origin);
    });
  };

  const extractPages = async (value) => {
    return new Promise((resolve, reject) => {
      const listener = (event) => {
        if (event.data.type === 'extract-pages-completed' && event.data.success) {
          resolve(event.data.result);  // Resolve the promise with the result
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
        else if (event.data.type === 'extract-pages-failed') {
          reject(new Error(event.data.message));  // Reject the promise with the error message
          window.removeEventListener('message', listener);  // Remove the listener to clean up
        }
      };
  
      // Adding the event listener before sending the postMessage
      window.addEventListener('message', listener);
  
      // @ts-ignore
      var iframeWin = document?.getElementById('webviewer-1')?.contentWindow;
    
      // Sending the extract-pages message to the iframe
      iframeWin.postMessage({ type: 'extract-pages', value }, window.location.origin);
    });
  };
  
  return {
    removeChatHistory,
    splitPages,
    combineFiles, 
    mergeFiles,
    pagesLoaded,
    extractPages,
    download,
    toggleSearchbar,
    toggleFullScreenThumbnails,
    isReady: internalIsReady, setThumbnailZoom, selectedPages
  };
};

export { useCreateIframeAndLoadViewer };

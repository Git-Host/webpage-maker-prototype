function absolutifyURL(relativeURL) {
  var a = $('<a></a>');
  a.attr("href", relativeURL);
  return a[0].href;
}

$(window).ready(function() {
  var DELAY_MS = 300;
  var delay;
  var templateURL;
  var editor = CodeMirror(function(element) {
    $("#source").append(element);
  }, {
    mode: "text/html",
    theme: "jsbin",
    tabMode: "indent",
    lineWrapping: true,
    onChange: schedulePreviewRefresh
  });

  function schedulePreviewRefresh() {
    clearTimeout(delay);
    delay = setTimeout(updatePreview, DELAY_MS);
  }

  function updatePreview() {
    function update() {
      var previewDocument = $("#preview").contents()[0];
      previewDocument.open();
      previewDocument.write(editor.getValue());
      previewDocument.close();
    }
    
    try {
      update();
    } catch (e) {
      // The user probably clicked on a link in the page and is
      // somewhere else now, so let's reload our blank page.
      var iframeWindow = $("#preview")[0].contentWindow;
      iframeWindow.location = "blank.html";
      $("#preview").one("load", update);
    }
  }

  schedulePreviewRefresh();
  
  $(".templates li").click(function() {
    $(".intro-only").fadeOut();
    var id = $(this).attr("id");
    templateURL = absolutifyURL('templates/' + id + '.html');
    jQuery.get(templateURL, function(data) {
      $("#panes, #actions").show();
      editor.setValue(data);
      schedulePreviewRefresh();
    }, 'text');
  });

  $("div.overlay-outer .close").click(function() {
    $("div.overlay-outer").fadeOut(function() {
      $("div.overlay-outer .done").removeClass("visible");
    });
  });
  
  $("#actions input").click(function() {
    var hackpubURL = "http://hackpub.hackasaurus.org/";
    var html = editor.getValue();
    if (html.length) {
      $("div.overlay-outer").fadeIn();
      $("div.overlay-outer .throbber").fadeIn();
      var timeout = DeferredTimeout(1000);
      var publish = DeferredPublish(html, templateURL, hackpubURL);
      jQuery.when(publish, timeout).then(function onSuccess(publishArgs) {
        var data = publishArgs[0];
        var url = data['published-url'];
        $("div.overlay-outer .throbber").fadeOut(function() {
          $(".published-url a").attr("href", url).text(url);
          $("div.overlay-outer .done").addClass("visible");
        });
      },
      function onFailure() {
        $("div.overlay-outer .close").click();
      });
    }
  });
});

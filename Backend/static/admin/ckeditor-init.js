(function () {
    "use strict";

    function initializeUnprocessedEditors() {
        if (!document.querySelector(".django_ckeditor_5:not([data-processed])")) {
            return;
        }

        // django-ckeditor-5 registers its initializer on DOMContentLoaded.
        // Unfold may attach form media after that event, so replay it once for
        // fields which the bundle has not processed yet.
        document.dispatchEvent(new Event("DOMContentLoaded"));
    }

    if (document.readyState === "loading") {
        window.addEventListener("load", initializeUnprocessedEditors, { once: true });
    } else {
        window.setTimeout(initializeUnprocessedEditors, 0);
    }
})();

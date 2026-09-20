(function () {
    "use strict";

    const buttonLabel = "Toggle fullscreen editor";

    function icon() {
        return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/></svg>';
    }

    function updateButton(button, editor) {
        const active = document.fullscreenElement === editor;
        button.classList.toggle("ck-on", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("title", active ? "Exit fullscreen editor" : "Enter fullscreen editor");
    }

    function addFullscreenControl(editor) {
        if (editor.dataset.hovucaFullscreenReady === "true") return;
        const toolbarItems = editor.querySelector(".ck-toolbar__items");
        if (!toolbarItems || !document.fullscreenEnabled) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "ck ck-button hovuca-ckeditor-fullscreen";
        button.setAttribute("aria-label", buttonLabel);
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("title", "Enter fullscreen editor");
        button.innerHTML = icon();

        button.addEventListener("click", async function () {
            try {
                if (document.fullscreenElement === editor) {
                    await document.exitFullscreen();
                } else {
                    await editor.requestFullscreen();
                }
            } catch (error) {
                console.error("Unable to change editor fullscreen state.", error);
            }
        });

        document.addEventListener("fullscreenchange", function () {
            updateButton(button, editor);
        });
        toolbarItems.append(button);
        editor.dataset.hovucaFullscreenReady = "true";
    }

    function attachControls() {
        document.querySelectorAll(".django_ckeditor_5 + .ck-editor, .ck-editor").forEach(addFullscreenControl);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attachControls);
    } else {
        attachControls();
    }

    new MutationObserver(attachControls).observe(document.documentElement, { childList: true, subtree: true });
})();

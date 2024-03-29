javascript:(function() {
    var isHighlighting = false;
    var highlights = [];

    function toggleHighlight() {
        if (isHighlighting) {
            highlights.forEach(function (highlight) {
                highlight.parentNode.removeChild(highlight);
            });
        } else {
            var elements = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="textbox"]');
            
            elements.forEach(function (element) {
                var rect = element.getBoundingClientRect();
                if (rect.width < 24 || rect.height < 24) {
                    var highlight = document.createElement('div');
                    var sizeLabel = document.createElement('div');

                    highlight.style.position = 'absolute';
                    highlight.style.border = '2px solid red';
                    highlight.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                    highlight.style.pointerEvents = 'none';
                    highlight.style.boxSizing = 'border-box';

                    highlight.style.width = rect.width + 'px';
                    highlight.style.height = rect.height + 'px';
                    highlight.style.top = rect.top + window.scrollY + 'px';
                    highlight.style.left = rect.left + window.scrollX + 'px';

                    sizeLabel.style.position = 'absolute';
                    sizeLabel.style.color = 'red';
                    sizeLabel.style.fontSize = '12px';
                    sizeLabel.style.fontFamily = 'Arial, sans-serif';
                    sizeLabel.style.pointerEvents = 'none';
                    sizeLabel.style.top = rect.top + window.scrollY + rect.height + 5 + 'px';
                    sizeLabel.style.left = rect.left + window.scrollX + 'px';
                    sizeLabel.innerHTML = rect.width.toFixed(1) + ' x ' + rect.height.toFixed(1);

                    document.body.appendChild(highlight);
                    document.body.appendChild(sizeLabel);

                    highlights.push(highlight);
                    highlights.push(sizeLabel);
                }
            });
        }

        isHighlighting = !isHighlighting;
    }

    toggleHighlight();
})();

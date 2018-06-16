function handler(data) {
  let { countries, regions, cities, common, excludePatterns, langs } = data;
  let stopWords = [...countries, ...regions, ...cities, ...common];
  let eventAmount = 0;
  const pageContent = document.querySelector('.mw-parser-output');

  // beatify
  function saveCalendar() {
    const calendarContainer = pageContent.querySelector('.toccolours');

    pageContent.parentNode.insertBefore(calendarContainer.cloneNode(true), pageContent);

    console.log('Calendar is successfully saved.');
  };

  // beatify
  // it should remove images, titles, tables — unuseful stuff.
  const removeUnnecessary = () => {
    $('.mw-parser-output>*:not(ul)').remove();
    pageContent.querySelectorAll('.thumb').remove();
    pageContent.querySelectorAll('.mw-empty-elt').remove();
    // Start group removed unnecessary events
    console.groupCollapsed('Below you`ve seen a list of removed items');

    const events = pageContent.querySelectorAll('li');
    // We removed everything, that doesn't starts with a year.
    Array.from(events).forEach((it) => {
      if (isNaN( parseInt(it.textContent) )) {
        console.log(it.textContent);
        it.remove();
      }
    });
    console.groupEnd();
  };

  // beatify
  // it should transform nested lists into neigbouring list elements.
  // and also for strange reason it removes some other elements, like reference links and empty lists.
  const beatifyDOM = () => {
    // Start group lifted up nested items
    console.groupCollapsed('List of glued events');
    // We beatify DOM: lift up nested list items.
    Array.from(document.querySelectorAll('.mw-parser-output li > ul,.mw-parser-output li > dl')).forEach((it) => {
      let parent = it.parentNode;
      let link = parent.firstChild.cloneNode(true);
      Array.from(it.children).forEach((el) => {
        let elContent = el.innerHTML;
        let parentCopy = parent.cloneNode();
        // We check: should we or not add hyphens
        let isNotHyphen = (typeof el.firstChild.data === 'undefined') || !~el.firstChild.data.indexOf('—');
        let hyphenString = ' — ';
        parent.parentNode.insertBefore(parentCopy, parent);

        parentCopy.insertBefore(link, null);
        if (isNotHyphen) {
          parentCopy.innerHTML += hyphenString;
        }
        parentCopy.innerHTML += elContent;
        console.log(parentCopy.innerText);
      })
      parent.remove();
    })

    Array.from(document.querySelectorAll('.reference')).forEach((it) => it.remove());
    Array.from(document.querySelectorAll('ul')).filter((it) => it.children.length === 0).forEach((it) => it.remove());

    console.groupEnd();
  }

  // wtf
  // nobody knows what is it.
  const uniteLists = () => {
    let parent = document.querySelector('.event-person').parentNode;
    let prevParent = parent.previousElementSibling;
    while (prevParent.previousElementSibling !== null) {
      prevParent.innerHTML = prevParent.previousElementSibling.innerHTML + prevParent.innerHTML;
      prevParent.previousElementSibling.remove();
    }

    while (parent.nextElementSibling !== null) {
      parent.innerHTML = parent.innerHTML + parent.nextElementSibling.innerHTML;
      parent.nextElementSibling.remove();
    }
  }

  // wtf
  // it should calc amount of events.
  const calcEventAmount = () => {
    Array.from(document.querySelectorAll('.mw-parser-output li')).reduce((max, it, index) => {
      let child = it.firstChild;
      if (typeof child.innerHTML !== 'undefined') {
        child = child.firstChild;
      };

      if (child.data === ' ') {
        child = child.nextSibling;
        if (typeof child.innerHTML !== 'undefined') {
          child = child.firstChild;
        };
      };

      if (max > parseInt(child.data) && (eventAmount === 0)) {
        eventAmount = index;
      };

      if (isNaN(parseInt(child.data))) {
        return max;
      };

      if (child.data.includes('до н. э.')) {
        return max;
      }

      return Math.max(max, parseInt(child.data));
    }, 0);
  }

  // smth with links
  // actually, it doesn't remove link, it just hide it to data-attr,
  // and on the second click returns everything back.
  const removeLink = (link) => {
    if (link.hasAttribute('href')) {
      link.style = 'color: rgba(244, 67, 54, 0.75); text-decoration: none';
      link.dataset.href = link.getAttribute('href');
      link.removeAttribute('href');
    } else {
      link.style = '';
      link.setAttribute('href', link.dataset.href);
    }
  }

  // smth with links
  // add red cross to right side of row.
  const addRemoveLink = (li) => {
    var removeLink = document.createElement('span');
    removeLink.classList.add('remove-link');
    removeLink.innerHTML = ' — Удалить &#x274C;';
    removeLink.style = 'user-select :none; cursor: pointer; color: red';
    removeLink.addEventListener('click', () => li.remove());
    li.appendChild(removeLink);
  }

  // wtf
  const addEventItem = (it) => {
    let delimiter = document.querySelectorAll('.event-person')[1];
    let newLi = document.createElement('li');
    newLi.innerHTML = it;
    delimiter.parentNode.insertBefore(newLi, delimiter);
  }

  // filter smth
  const removeStopWords = (isNotPrint = true) => {
    // Vars for deleting common words: country names, jobs — everything doesn't interesting.
    // let stopWords = ['Япония'];
    // let langs = ['en', 'pl', 'nl'];
    Array.from(document.querySelectorAll('.mw-parser-output li')).map((it) => it.querySelectorAll('a')).forEach((it, index) => {
      let links = Array.from(it).filter((el) => el.href !== '');

      // Add visual delimiter in developer's console.
      if (index === eventAmount) {
        if (!isNotPrint) {
          let newItem = document.createElement('li');
          newItem.style = 'border-top: 3px solid red';
          newItem.classList.add('event-person');
          it[0].parentNode.parentNode.insertBefore(newItem, it[0].parentNode);
        };
        console.warn('Below you`ve seen list of persons');
      };

      // It occurs, that for person name keeps alwayws at the first link after year. So, we removed others.
      if (index >= eventAmount) {
        links = links.filter((it, elIndex) => elIndex < 2);
      };

      let filteredLinks = isNotPrint ? links : links.filter((it) => {
        let linkTitle = it.title;
        let isLocalLinks = new RegExp('^(' + langs.join('|') + '):').test(linkTitle);
        let isBadPatterns = new RegExp(excludePatterns.join('|')).test(linkTitle);
        // let isNoPage = ~linkTitle.indexOf('страница отсутствует');
        let isDate = !isNaN(parseInt(linkTitle)) && linkTitle.length < 5;
        // let isDateWithText = /^\d{1,4}\sгод/.test(linkTitle);
        let isStopWords = new RegExp('^(' + stopWords.join('|') + ')$').test(linkTitle);
        let isEmpty = linkTitle === '';

        let successFiltered = !isLocalLinks && !isBadPatterns && !isDate && !isStopWords && !isEmpty;
        if (!successFiltered) {
          removeLink(it);
        };

        return successFiltered;
      });

      // If year link is absent, we'll need only first link text.
      // Test functionality.
      if (index >= eventAmount && filteredLinks.length > 1) {
        filteredLinks.pop();
      }

      filteredLinks = filteredLinks.map((el) => {
        return el.title;
      });


      if ((index < eventAmount || filteredLinks.length > 0) && isNotPrint) {

        if (filteredLinks.length > 0 && index >= eventAmount) {
          it[0].parentNode.innerHTML = filteredLinks[0];
        } else {
          addEventItem(filteredLinks.join('|') + '&nbsp;');
        }
      }
    });
  }

  // smth with links
  const removeLinks = () => {
    Array.from(document.querySelectorAll('a')).forEach((it) => {
      it.addEventListener('click', (e) => {
        e.preventDefault();
        removeLink(it);
      })
    })
  }

  let visualControls = {
    // show first btn
    addDoAllBtn() {
      let btn = document.createElement('button');

      addUi();
      function addUi() {
        btn.innerHTML = 'All you need';
        btn.classList.add('do-all-btn');
        const css = `.do-all-btn{position:fixed;right:30px;top:30px;z-index:1000;width:150px;padding:3px 24px 2px;font-size:16px;line-height:35px;color:#191919;background:#fab964;box-shadow:4px 4px 10px 1px #eee;border:none;border-radius:20px;transition:.5s;cursor:pointer}.do-all-btn:hover{box-shadow:0 0 10px 1px #eee}`;

        let style = document.createElement('style');
        if (style.styleSheet) {
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
      };

      btn.addEventListener('click', handler);
      function handler() {
        btn.removeEventListener('click', handler);
        btn.remove();
        doAll();
      };

      document.body.insertBefore(btn, null);
    },
    // show second btn
    addDoItBtn() {
      let btn = document.createElement('button');

      addUi();
      function addUi() {
        btn.innerHTML = 'Do it!';
        btn.classList.add('do-all-btn', 'do-it-btn');
        const css = `.do-it-btn{color:#fff;background:#fa7369}`;

        let style = document.createElement('style');
        if (style.styleSheet) {
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
      }

      btn.addEventListener('click', handler);
      function handler() {
        btn.removeEventListener('click', handler);
        btn.remove();
        doIt();
      }

      document.body.insertBefore(btn, null);
    },
    // add copy link
    addCopyEventsDescriptionBtn() {
      let link = document.createElement('button');

      addUi();
      function addUi() {
        link.innerHTML = 'Copy events list';
        link.classList.add('copy-events-link');

        const css = `.copy-events-link{position:fixed;right:30px;top:80px;z-index:1000;padding:0;font-size:12px;line-height:15px;color:#426cd4;border:none;border-bottom:1px solid rgba(66, 108, 212, 0.85);background:none;transition:.5s;cursor:pointer}.copy-events-link:hover{border-color:rgba(66, 108, 212, 0.35)}`;

        let style = document.createElement('style');
        if (style.styleSheet) {
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
      }

      link.addEventListener('click', handler);
      function handler() {
        let eventsDescriptionList = document.querySelector('.event-person').parentNode.previousElementSibling;
        copytoBuffer(eventsDescriptionList);
      };

      document.body.insertBefore(link, null);
    },
    // add another copy link
    addCopyEventsLinksBtn() {
      let link = document.createElement('button');

      addUi();
      function addUi() {
        link.innerHTML = 'Copy persons list';
        link.classList.add('copy-events-link', 'copy-persons-link');

        const css = `.copy-persons-link{right:30px;top:100px}`;

        let style = document.createElement('style');
        if (style.styleSheet) {
          style.styleSheet.cssText = css;
        } else {
          style.appendChild(document.createTextNode(css));
        }

        document.getElementsByTagName('head')[0].appendChild(style);
      }

      link.addEventListener('click', handler);
      function handler() {
        let eventsLinkList = document.querySelector('.event-person').parentNode;
        copytoBuffer(eventsLinkList);
      };

      document.body.insertBefore(link, null);
    },
    addSecondSet() {
      this.addDoItBtn();
      this.addCopyEventsDescriptionBtn();
      this.addCopyEventsLinksBtn();
    }
  }

  // copy element to exchange buffer
  // copy events and persons uses it.
  function copytoBuffer(it) {
    let range = document.createRange();
    range.selectNode(it);
    window.getSelection().addRange(range);

    try {
      let success = document.execCommand('copy');
      console.log(success ? 'copy successed' : 'copy failure');
    } catch (err) {
      console.log(err);
    }

    window.getSelection().removeAllRanges();
  }

  // handler for first btn
  const doAll = () => {
    // Save calendar before work.
    saveCalendar();
    // console.Clear console
    console.clear();
    // Remove everything besides events.
    removeUnnecessary();
    beatifyDOM();
    // We calculate index delimiter: when events end and persons start.
    calcEventAmount();
    // Filter links through our filters
    removeStopWords(false);
    // Unite several lists in one.
    uniteLists();
    // Remove person's events from DOM.
    removeLinks();
    visualControls.addSecondSet();
  }

  // smth with links
  const addRemoveLinksToPersons = () => {
    let flag = false;
    Array.from(document.querySelectorAll('.mw-parser-output li')).filter((it, index) => {
      if (it.classList.contains('event-person')) {
        flag = true;
      };
      return flag;
    }).forEach((it) => addRemoveLink(it));
  }

  // add some delimiter
  const addAnotherDelimiter = () => {
    let delimiter = document.querySelector('.event-person');
    let copyDelimiter = delimiter.cloneNode();
    delimiter.parentNode.insertBefore(copyDelimiter, delimiter);
  }

  // handler for second btn
  const doIt = () => {
    addAnotherDelimiter();
    removeStopWords();
    addRemoveLinksToPersons();
  }

  // show in any case just now.
  // show or not 'do all btn'.
  if (document.querySelector('.toccolours:first-child') !== null || true) {
    visualControls.addDoAllBtn();
  }
}
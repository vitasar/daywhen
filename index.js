function handler(data) {
  let { countries, regions, cities, common, excludePatterns, langs } = data;
  let stopWords = [...countries, ...regions, ...cities, ...common];
  let eventAmount = 0;
  const pageContent = document.querySelector('.mw-parser-output');

  // beatify
  function saveCalendar() {
    const calendarContainer = pageContent.querySelector('.toccolours');

    pageContent.parentNode.before(calendarContainer);

    console.log('Calendar is successfully saved.');
  };

  const techMoves = {
    removeCollection(set) {
      if (set.length) {
        for (let i = 0; i < set.length; i++) {
          set[i].remove();
        }
      }
    },
    CLASS_DELIMITER: 'event-person',
    createDelimiter() {
      const delimiter = document.createElement('li');
      delimiter.style = 'border-top: 3px solid red';
      delimiter.classList.add(this.CLASS_DELIMITER);
      return delimiter;
    },
    addRowEraser(row) {
      const eraser = document.createElement('span');
      eraser.classList.add('remove-link');
      eraser.innerHTML = ' — Удалить &#x274C;';
      eraser.style = 'user-select: none; cursor: pointer; color: red';
      eraser.addEventListener('click', () => row.remove());
      row.append(eraser);
    }
  };

  // beatify
  // remove images, titles, tables — unuseful stuff.
  function removeUnnecessary() {
    const unwantedElements = {
      notListChildren: [...pageContent.children].filter((it) => !it.matches('ul')),
      images: pageContent.querySelectorAll('.thumb'),
      commentaries: pageContent.querySelectorAll('.mw-empty-elt'),
      references: pageContent.querySelectorAll('.reference')
    };
    for (name in unwantedElements) {
      techMoves.removeCollection(unwantedElements[name]);
    };

    // Start group removed unnecessary events
    console.groupCollapsed('Below you`ve seen a list of removed items');

    // We removed everything, that doesn't starts with a year.
    [...pageContent.querySelectorAll('li')]
      .forEach((it) => {
        const isNotNestedElement = () => !it.closest('li li');
        const isNotNumberFirst = () => isNaN(parseInt(it.textContent));
        if (isNotNestedElement() && isNotNumberFirst()) {
          console.log(it.textContent);
          it.remove();
        }
      });
    console.groupEnd();
  };

  // beatify
  // transform nested lists into neigbouring list elements.
  function beatifyDOM() {
    const nestedLists = [...pageContent.querySelectorAll('li > ul,li > dl')];

    console.groupCollapsed('List of glued events');

    // We beatify DOM: lift up nested list items.
    nestedLists.forEach((list) => {
      const itemWithList = list.parentNode;
      const itemTitle = itemWithList.firstChild;

      [...list.children].forEach((nestedItem) => {
        const liftedUpItem = itemWithList.cloneNode();
        liftedUpItem.append(itemTitle.cloneNode(true), ' — ');
        liftedUpItem.innerHTML += nestedItem.innerHTML;

        itemWithList.before(liftedUpItem);

        console.log(nestedItem.textContent);
      })
    })

    techMoves.removeCollection(nestedLists.map(it => it.parentNode));

    console.groupEnd();
  }

  // beatify
  // unites multiply lists into just two: events & persons.
  // it is necessary because of script selection later.
  function uniteLists() {
    const firstPersonList = pageContent.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode;

    // unite events lists.
    const eventsFragment = document.createDocumentFragment();
    let tempEventList = firstPersonList;
    while (tempEventList = tempEventList.previousElementSibling) {
      [...tempEventList.children].reverse().forEach((it) => eventsFragment.prepend(it));
    }
    const eventsList = firstPersonList.cloneNode();
    eventsList.append(eventsFragment);

    // unite persons lists.
    const personsFragment = document.createDocumentFragment();
    [...firstPersonList.children].forEach((it) => personsFragment.append(it));
    let tempPersonList = firstPersonList;
    while (tempPersonList = tempPersonList.nextElementSibling) {
      [...tempPersonList.children].forEach((it) => personsFragment.append(it));
    }
    const personList = firstPersonList.cloneNode();
    personList.append(personsFragment);

    pageContent.innerHTML = '';
    pageContent.append(eventsList, personList);
  }

  // wtf
  // it should calc amount of events.
  function addDelimiterBeforePerson() {
    [...pageContent.querySelectorAll('li')]
      .map((it) => parseInt(it.textContent))
      .reduce((max, it, index) => {
        if (max > it && eventAmount === 0) {
          eventAmount = index;
        };
        if (isNaN(it)) {
          return max;
        };

        return Math.max(max, it);
      }, 0);

    pageContent.querySelectorAll('li')[eventAmount].before(techMoves.createDelimiter());
  }

  // smth with links
  // toggle link active state
  const toggleLinkActivity = (link) => {
    if (link.hasAttribute('href')) {
      link.style = 'color: rgba(244, 67, 54, 0.75); text-decoration: none';
      link.dataset.href = link.getAttribute('href');
      link.removeAttribute('href');
    } else {
      link.style = '';
      link.setAttribute('href', link.dataset.href);
    }
  }

  // wtf
  const addEventItem = (eventContent) => {
    const lastDelimiter = pageContent.querySelectorAll(`.${techMoves.CLASS_DELIMITER}`)[1];
    lastDelimiter.insertAdjacentHTML('beforeBegin', `<li>${eventContent}</li>`);
  }

  // pass events through filters
  function deactivateLinksByStopWords() {
    [...pageContent.querySelectorAll('li')]
      // [[a, a, a], [a, a], [a, a, a]]
      .map((listItem) => listItem.querySelectorAll('a'))
      .forEach((linkSet) => {
        [...linkSet].forEach((link) => {
          const filters = {
            isLocalLinks: new RegExp('^(' + langs.join('|') + '):').test(link.title),
            isBadPatterns: new RegExp(excludePatterns.join('|')).test(link.title),
            isDate: !isNaN(parseInt(link.title)) && link.title.length < 5,
            isStopWords: new RegExp('^(' + stopWords.join('|') + ')$').test(link.title),
            isEmpty: link.title === ''
          };

          const isFilterFailed = Object.keys(filters).some((key) => filters[key]);

          if (isFilterFailed) {
            toggleLinkActivity(link);
          };
        });
      });
  }

  // filter smth
  const removeStopWords = () => {
    [...pageContent.querySelectorAll('li')]
      .map((listItem) => listItem.querySelectorAll('a'))
      .forEach((it, index) => {
        let links = Array.from(it).filter((el) => el.href !== '');

        // It occurs, that for person name keeps always at the first link after year. So, we removed others.
        if (index >= eventAmount) {
          links = links.filter((it, elIndex) => elIndex < 2);
        };

        // If year link is absent, we'll need only first link text.
        // Test functionality.
        if (index >= eventAmount && links.length > 1) {
          links.pop();
        }

        links = links.map((el) => {
          return el.title;
        });


        if (index < eventAmount || links.length > 0) {

          if (links.length > 0 && index >= eventAmount) {
            it[0].parentNode.innerHTML = links[0];
          } else {
            addEventItem(links.join('|') + '&nbsp;');
          }
        }
      });
  }

  // smth with links
  // handler for toggle activity
  const addLinkClickHandler = () => {
    [...pageContent.querySelectorAll('a')]
      .forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          toggleLinkActivity(link);
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
        let eventsDescriptionList = document.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode.previousElementSibling;
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
        let eventsLinkList = document.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode;
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
    addDelimiterBeforePerson();
    // Filter links through our filters
    deactivateLinksByStopWords();
    // Unite several lists in one.
    uniteLists();
    // Remove person's events from DOM.
    addLinkClickHandler();
    visualControls.addSecondSet();
  }

  // smth with links
  function addRowErasers() {
    const persons = pageContent.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode.children;
    [...persons].forEach((it) => techMoves.addRowEraser(it));
  }

  // add some delimiter
  function addAnotherDelimiter() {
    const delimiter = pageContent.querySelector(`.${techMoves.CLASS_DELIMITER}`);
    delimiter.before(techMoves.createDelimiter());
  }

  // handler for second btn
  const doIt = () => {
    addAnotherDelimiter();
    removeStopWords();
    addRowErasers();
  }

  // show in any case just now.
  // show or not 'do all btn'.
  if (document.querySelector('.toccolours:first-child') !== null || true) {
    visualControls.addDoAllBtn();
  }
}
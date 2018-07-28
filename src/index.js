function handler(data) {
  /*
   * stories
   *  story
   *    row
   * generic
   *  events
   *    row
   *  persons
   *    row
   */
  const { countries, regions, cities, common, excludePatterns, langs } = data;
  const stopWords = [...countries, ...regions, ...cities, ...common];
  const pageContent = document.querySelector('.mw-parser-output');

  // doesn't influence DOM by themselves
  const techMoves = {
    addCss() {
      const css = {
        'row-eraser': '.row-eraser{user-select: none; cursor: pointer; color: red}',
        'delimiter': '.delimiter{border-top: 3px solid red}',
        'stories-link': '.stories-link{position:fixed;right:30px;top:80px;z-index:1000;padding:0;font-size:12px;line-height:15px;color:#426cd4;border:none;border-bottom:1px solid rgba(66, 108, 212, 0.85);background:none;transition:.5s;cursor:pointer}.stories-link:hover{border-color:rgba(66, 108, 212, 0.35)}',
        'generic-link': '.generic-link{right:30px;top:100px}',
        'parse-btn': '.parse-btn{position:fixed;right:30px;top:30px;z-index:1000;width:150px;padding:3px 24px 2px;font-size:16px;line-height:35px;color:#191919;background:#fab964;box-shadow:4px 4px 10px 1px #eee;border:none;border-radius:20px;transition:.5s;cursor:pointer}.parse-btn:hover{box-shadow:0 0 10px 1px #eee}',
        'edit-btn': '.edit-btn{color:#fff;background:#fa7369}',
        'toggle-link': '.toggle-link{color: rgba(244, 67, 54, 0.75); text-decoration: none}'
      };

      const style = document.createElement('style');
      style.textContent = Object.values(css).join('');

      document.head.append(style);
    },
    addLinkClickHandler() {
      [...pageContent.querySelectorAll('a')]
        .forEach((link) => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            techMoves.toggleLinkActivity(link);
          })
        })
    },
    addRowEraser(row) {
      const eraser = document.createElement('span');
      eraser.classList.add('row-eraser');
      eraser.innerHTML = ' — Удалить &#x274C;';
      eraser.addEventListener('click', () => row.remove());
      row.append(eraser);
    },
    addRowErasers() {
      const genericRows = pageContent.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode.children;
      [...genericRows].forEach((row) => techMoves.addRowEraser(row));
    },
    copytoBuffer(element) {
      window.getSelection().removeAllRanges();

      const range = document.createRange();
      range.selectNode(element);
      window.getSelection().addRange(range);

      document.execCommand('copy');
    },
    CLASS_DELIMITER: 'delimiter',
    createDelimiter() {
      const delimiter = document.createElement('li');
      delimiter.classList.add(techMoves.CLASS_DELIMITER);
      return delimiter;
    },
    storiesAmount: 0,
    deactivateLink(link) {
      link.classList.add('toggle-link');
      link.dataset.href = link.getAttribute('href');
      link.removeAttribute('href');
    },
    activateLink(link) {
      link.classList.remove('toggle-link');
      link.setAttribute('href', link.dataset.href);
    },
    toggleLinkActivity(link) {
      const allLinksInRow = link.closest('li').querySelectorAll('a');
      [...allLinksInRow].forEach(this.deactivateLink);

      this.activateLink(link);
    },
    removeCollection(set) {
      if (set.length) {
        for (let i = 0; i < set.length; i++) {
          set[i].remove();
        }
      }
    }
  };

  const visualControls = {
    // show first btn
    addParseBtn() {
      techMoves.addCss();

      const btn = document.createElement('button');
      btn.innerHTML = 'All you need';
      btn.classList.add('parse-btn');

      btn.addEventListener('click', handler);
      function handler() {
        btn.removeEventListener('click', handler);
        btn.remove();
        parsePage();
      };

      document.body.prepend(btn);
    },
    // show second btn
    addEditBtn() {
      const btn = document.createElement('button');
      btn.innerHTML = 'Do it!';
      btn.classList.add('parse-btn', 'edit-btn');

      btn.addEventListener('click', handler);
      function handler() {
        btn.removeEventListener('click', handler);
        btn.remove();
        editPage();
      }

      document.body.prepend(btn);
    },
    // add copy link
    addStoriesBtn() {
      const link = document.createElement('button');
      link.innerHTML = 'Copy events list';
      link.classList.add('stories-link');

      link.addEventListener('click', handler);
      function handler() {
        const stories = document.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode.previousElementSibling;
        techMoves.copytoBuffer(stories);
      };

      document.body.prepend(link);
    },
    // add another copy link
    addGenericBtn() {
      const link = document.createElement('button');
      link.innerHTML = 'Copy persons list';
      link.classList.add('stories-link', 'generic-link');

      link.addEventListener('click', handler);
      function handler() {
        const generic = document.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode;
        techMoves.copytoBuffer(generic);
      };

      document.body.prepend(link);
    },
    addEditControls() {
      visualControls.addEditBtn();
      visualControls.addStoriesBtn();
      visualControls.addGenericBtn();
    }
  }

  // handler for first btn
  const parsePage = () => {
    // prepare
    saveCalendar();
    console.clear();

    // modify
    deleteUnwanted();
    transformNested();
    addGenericDelimiter();
    uniteLists();

    // beatify
    filterLinks();
    techMoves.addLinkClickHandler();
    visualControls.addEditControls();
  }

  const editPage = () => {
    addPersonDelimiter();
    prepareGeneric();
    techMoves.addRowErasers();
  }

  // prepare
  function saveCalendar() {
    const calendarContainer = pageContent.querySelector('.toccolours');

    pageContent.before(calendarContainer);

    console.log('Calendar is successfully saved.');
  };

  // modify
  function deleteUnwanted() {
    const unwantedContent = {
      notListChildren: [...pageContent.children].filter((it) => !it.matches('ul')),
      images: pageContent.querySelectorAll('.thumb'),
      commentaries: pageContent.querySelectorAll('.mw-empty-elt'),
      references: pageContent.querySelectorAll('.reference')
    };
    for (name in unwantedContent) {
      techMoves.removeCollection(unwantedContent[name]);
    };

    // Start group removed unnecessary events
    console.groupCollapsed('Deleted unwanted content');

    // We removed everything, that doesn't starts with a year.
    [...pageContent.querySelectorAll('li')]
      .forEach((row) => {
        const isNotNestedElement = () => !row.closest('li li');
        const isNotNumberFirst = () => isNaN(parseInt(row.textContent));
        if (isNotNestedElement() && isNotNumberFirst()) {
          console.log(row.textContent);
          row.remove();
        }
      });
    console.groupEnd();
  };

  function transformNested() {
    const nestedLists = [...pageContent.querySelectorAll('li > ul,li > dl')];

    console.groupCollapsed('Nested list elements');

    // We beatify DOM: lift up nested list items.
    nestedLists.forEach((list) => {
      const firstLevelItem = list.parentNode;
      const title = firstLevelItem.firstChild;

      [...list.children].forEach((nestedItem) => {
        const liftedUpItem = firstLevelItem.cloneNode();
        liftedUpItem.append(title.cloneNode(true), ' — ');
        liftedUpItem.innerHTML += nestedItem.innerHTML;

        firstLevelItem.before(liftedUpItem);

        console.log(nestedItem.textContent);
      })
    })

    techMoves.removeCollection(nestedLists.map(list => list.parentNode));

    console.groupEnd();
  }

  function addGenericDelimiter() {
    [...pageContent.querySelectorAll('li')]
      .map((it) => it.textContent)
      .reduce((maxYear, rowText, sequenceNumber) => {
        const rowYear = parseInt(rowText);
        if (isNaN(rowYear) || ~rowText.search('н. э.')) {
          return maxYear;
        };

        if (maxYear > rowYear && techMoves.storiesAmount === 0) {
          techMoves.storiesAmount = sequenceNumber;
        };

        return Math.max(maxYear, rowYear);
      }, 0);

    pageContent.querySelectorAll('li')[techMoves.storiesAmount].before(techMoves.createDelimiter());
  }

  function uniteLists() {
    const tempGeneric = pageContent.querySelector(`.${techMoves.CLASS_DELIMITER}`).parentNode;

    // unite events lists.
    const storiesSet = document.createDocumentFragment();
    let tempStory = tempGeneric;
    while (tempStory = tempStory.previousElementSibling) {
      [...tempStory.children].reverse().forEach((story) => storiesSet.prepend(story));
    }
    const stories = tempGeneric.cloneNode();
    stories.append(storiesSet);

    // unite persons lists.
    const genericSet = document.createDocumentFragment();
    [...tempGeneric.children].forEach((row) => genericSet.append(row));
    let tempRow = tempGeneric;
    while (tempRow = tempRow.nextElementSibling) {
      [...tempRow.children].forEach((row) => genericSet.append(row));
    }
    const generic = tempGeneric.cloneNode();
    generic.append(genericSet);

    pageContent.innerHTML = '';
    pageContent.append(stories, generic);
  }

  // beatify
  function filterLinks() {
    [...pageContent.querySelectorAll('li')]
      // [[a, a, a], [a, a], [a, a, a]]
      .map((row) => row.querySelectorAll('a'))
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
            techMoves.toggleLinkActivity(link);
          };
        });
      });
  }

  function addPersonDelimiter() {
    const genericDelimiter = pageContent.querySelector(`.${techMoves.CLASS_DELIMITER}`);
    genericDelimiter.before(techMoves.createDelimiter());
  }

  function prepareGeneric() {
    [...pageContent.querySelectorAll('li')]
      .map((row) => row.querySelectorAll('a[href]'))
      .forEach((linkSet, sequenceNumber) => {
        const links = [...linkSet].map((link) => link.title);

        if (sequenceNumber < techMoves.storiesAmount) {
          addEventToGeneric(links.join('|'));
        } else if (links.length) {
          linkSet[0].parentNode.innerHTML = links[0];
        }
      });
  }

  function addEventToGeneric(eventContent) {
    const personsDelimiter = pageContent.querySelectorAll(`.${techMoves.CLASS_DELIMITER}`)[1];
    // space is nesessary, because of empty selection purpose.
    personsDelimiter.insertAdjacentHTML('beforeBegin', `<li>${eventContent}&nbsp;</li>`);
  }

  if (true) {
    visualControls.addParseBtn();
  }
}

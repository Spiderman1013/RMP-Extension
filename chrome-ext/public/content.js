function handleMessage(request, sender, sendResponse) {
    if (request.action === 'getSelection') {
      const selectedText = window.getUniversalSelection();
      sendResponse({ selection: selectedText});
    }
  }

   // Handle messages if running in content script context


   document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('search-input');
    const dropdown = document.getElementById('dropdown');
  
    if (!inputField || !dropdown) {
      console.error('Input field or dropdown element not found.');
      return;
    }
  
  inputField.addEventListener('input', async () => {
    const query = inputField.value;
    
    // Clear previous results
   dropdown.innerHTML = ''; 
    if (query.length > 0) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.runtime.sendMessage({ action: 'getSearchResults', textInput : query }, (response) => {
            console.log('Received response: YAYYYYY', response.school_names_and_id[0]);

            if (chrome.runtime.lastError) {
              console.error('Message sending error:', chrome.runtime.lastError);
              return;
            }
          
            if (!response) {
              console.error('No response received from getSearchResults');
              return;
            }
          
            if (!response.school_names_and_id) {
              console.error('school_names_and_id is missing from the response:', response);
              return;
            }
          
            let school_info = response.school_names_and_id;

            if (school_info.length > 0) {
              console.log(school_info[0]["id"], school_info[0]["name"]);}
                //search_results = response.school_names_and_id;
          //console.log(search_results);
        })})}})});
    
            
   
  
      if (window.location.href) {
          chrome.runtime.onMessage.addListener(handleMessage);
      }
  
 
   

  //document.addEventListener('DOMContentLoaded', function() {
    // Get references to the input field and button
    //const searchInput = document.getElementById('search-input');
    //const selectButton = document.getElementById('select_school');

    // Add event listener to the button
    //selectButton.addEventListener('click', function() {
        // Get the value from the input field
        //const inputValue = searchInput.value.trim();

        // Save the input value (you can save it to local storage, send it to background script, etc.)
        //console.log('Selected School:', inputValue);

        // Example: Save to local storage
        //chrome.storage.local.set({ selectedSchool: inputValue }, function() {
           // console.log('School name saved:', inputValue);
        //});

        // You can also close the popup if needed
        // window.close();
    //});
  //});

// Attach an event listener to the button


 
  

  
  // Handle popup interactions
  if (document.getElementById('get-selection')) {
    document.getElementById('get-selection').addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' }, (response) => {
          let selectedText = response.selection || 'No text selected';

          function flipName(name) {
            const [lastname, firstname] = name.split(', ').map(part => part.trim());
            return `${firstname} ${lastname}`;
          }
                  
          if (selectedText.includes(',')) {
            selectedText = flipName(selectedText);
          }
          selectedText = capitalizeWords(selectedText);
          console.log(selectedText);

          
          // Send selected text to background script to reverse it
          chrome.runtime.sendMessage({ action: 'rate_professor', professor: selectedText}, (response) => {
          
  
            // Load existing accordion data
            chrome.storage.local.get(['accordionData', 'professorNamesSet'], (result) => {
              accordionData = result.accordionData || [];
              professorNamesSet = result.professorNamesSet || [];
  
              // Append new text to the data array
              num_stars = []
              for (let i = 0; i < 5; i++){
                if(i < response.avgRatingRounded){
                  num_stars.push("enabled");
                }
                else{
                  num_stars.push("disabled");
                }
              }
              
              //process for getting the best rating and sorting the tags by count
              const maxRating = getMaxRating(response.extractedRatings)
              const tags = response.tagsArray.sort((a, b) => b.tagCount - a.tagCount);

              //console.log("YOOOO " + response.numRatings);
              if(professorNamesSet.includes(response.fullName)){
                  console.log("ERROR: DUPLICATE PROF NAME");
                  return;
              }
              if(response.fullName != selectedText){
                console.log("TEACHER NOT FOUND ON RMP");
                console.log(response.fullName + " " + selectedText);
                return;
              }
              
              professorNamesSet.push(response.fullName);
              
              console.log(professorNamesSet);
              accordionData.push(
                { prof_name: response.fullName, 
                  num_stars: num_stars, 
                  avgRating : response.avgRatingRounded,
                  department: response.department, 
                  difficulty : response.avgDifficultyRounded, 
                  numRatings : response.numRatings,
                  TAP: response.wouldTakeAgainPercentRounded, 
                  all_ratings : response.extractedRatings,
                  maxRating : maxRating,
                  school : response.school,
                  tags : tags,
                },
              );
              
              
              // Save updated accordion data
              chrome.storage.local.set({ accordionData: accordionData, professorNamesSet : professorNamesSet }, () => {
                // Render the updated accordion
                renderAccordion(accordionData);
              });
            });
          });
        });
      });
    });
  }
  
  if (document.getElementById('clear-accordion')) {
    document.getElementById('clear-accordion').addEventListener('click', () => {
      // Clear accordion data from storage
      chrome.storage.local.remove(['accordionData', 'professorNamesSet'], () => {
        const container = document.getElementById('accordion-container');
        if (container) {
          container.innerHTML = ''; // Clear all accordion collapses
        }
      });
    });
  }

  function capitalizeWords(str) {
    return str.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
  }

  // Function to render the accordion
  function renderAccordion(accordionData) {
    const container = document.getElementById('accordion-container');
    container.innerHTML = ''; // Clear existing accordions
    
    accordionData.forEach(data =>{
      const carouselHTML = renderCarousel(data['tags'], data['prof_name']);
      const newAccordion = `
        <div class="collapse collapse-arrow rounded mb-2" style="background-color: rgb(28, 33, 43); color: rgb(122, 193, 187); width: 100%; max-width: 600px;">
          <input type="checkbox" />
          <div class="collapse-title justify-between text-xl font-medium px-6 py-4 flex items-center">${data['prof_name']}
            <div class="rating ml-4 flex pointer-events-none mr-5">
              <input type="radio" name="rating-1" class="mask mask-star-2 bg-red-400 mr-1" ${data['num_stars'][0]}/>
              <input type="radio" name="rating-2" class="mask mask-star-2 bg-red-400 mr-1" ${data['num_stars'][1]}/>
              <input type="radio" name="rating-3" class="mask mask-star-2 bg-red-400 mr-1" ${data['num_stars'][2]}/>
              <input type="radio" name="rating-4" class="mask mask-star-2 bg-red-400 mr-1" ${data['num_stars'][3]}/>
              <input type="radio" name="rating-5" class="mask mask-star-2 bg-red-400 mr-1" ${data['num_stars'][4]}/>
            </div>
          </div>
          <div class="collapse-content">
          
            <div class="flex flex-col items-center rounded text-center p-4" style="background-color: rgb(28, 33, 43);">
              <p style="color: rgb(178, 204, 214);" class="text-center font-bold text-lg">${data['school']}</p>
              <p style="color: rgb(178, 204, 214);" class="text-center mb-2 font-bold text-lg">${data['department']}</p>
              


              <div class="stats shadow w-full mb-2">
                <div class="stat place-items-center flex-1">
                  <div style = "color: rgb(178, 204, 214);" class="stat-title text-xs">Take Again Percentage</div>
                  <div class="stat-value text-sm text-white">${Math.round(data['TAP'] * 10) / 10 + "%"}</div>
                </div>

                <div class="stat place-items-center flex-1">
                  <div style = "color: rgb(178, 204, 214);" class="stat-title text-xs">Average Difficulty</div>
                  <div class="stat-value text-sm text-white">${Math.round(data['difficulty'] * 10) / 10}/5</div>
                </div>
              </div>


              <div style="background-color: rgb(61, 68, 81);" class=" rounded-box carousel w-full mt-2 mb -2 h-16">
              ${carouselHTML}
              </div>
    

              <div style="background-color: rgb(61, 68, 81); padding: 15px; max-width: 500px;" class = "mt-4 rounded-box">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex;" >
                    <strong style="font-size: 16px; color: rgb(178, 204, 214);">${data['maxRating']['class']}</strong>
                  </div>
                  <span style="font-size: 12px; color: rgb(178, 204, 214); opacity: 0.6; ">${data['maxRating']['date'].slice(0, 10)}</span>
                </div>
                <p class = "text-left" style="margin-top: 10px; font-size: 14px; color: rgb(178, 204, 214); line-height: 1.5;">${data['maxRating']['comment']}</p>
                <div style="display: flex; align-items: center; margin-top: 10px; color: #666;">
                  <span style="margin-right: 1px;"><i class="fa fa-thumbs-up"></i>&#128077</span>
                  <span style="margin-right: 15px; opacity: 0.6; color: rgb(178, 204, 214); position: relative; top: 2px;"><i class="fa fa-thumbs-up"></i>${data['maxRating']['thumbsUpTotal']}</span>
                  <span style="margin-right: 1px;"><i class="fa fa-thumbs-down"></i>&#128078</span>
                  <span style="margin-right: 15px; opacity: 0.6; color: rgb(178, 204, 214); position: relative; top: 2px;"><i class="fa fa-thumbs-down"></i>${data['maxRating']['thumbsDownTotal']}</span>
                  <span style="margin-right: 15px; opacity: 0.6; color: rgb(178, 204, 214); position: relative; top: 2px;"><i></i>Attendance: ${capitalizeWords(data['maxRating']['attendanceMandatory'])}</span>
                </div>
            </div>

            </div>

          </div>

        </div>
      `;
      container.insertAdjacentHTML('beforeend', newAccordion);
    });
  }

  function renderCarouselElement(index, length, tag, name){
    return`<div id="slide${index+1+name}" class="carousel-item relative w-full flex flex-col items-center">
        <p style = "color: rgb(178, 204, 214);" class = "text-center text-lg mt-2">${tag['tagName']}</p>
        <p style = "color: rgb(178, 204, 214); opacity: 0.6;" class = "text-center mb-2">${tag['tagCount'] + " People Agree"}</p>
        <div class="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
        <a href="#slide${((index - 1) % length + 1)+name}" class="btn btn-circle">&#8592</a>
        <a href="#slide${((index + 1) % length + 1)+name}" class="btn btn-circle">&#8594</a>
      </div>
    </div>
    `
  }
  //tags is a list of dictionaries
  function renderCarousel(tags,name){
    html = "";
    for(let i = 0; i < tags.length; i++){
      html += renderCarouselElement(i,tags.length,tags[i], name);
    }
    return html
  }
  
  // Load accordion data on popup open
  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['accordionData'], (result) => {
      const accordionData = result.accordionData || [];
      renderAccordion(accordionData);
    });
  });



  function getUniversalSelection() {
    let selection = document.getSelection().toString().trim();

    if (!selection) {
        // Check Shadow DOMs
        const allShadowRoots = document.querySelectorAll('*');
        allShadowRoots.forEach(element => {
            if (element.shadowRoot) {
                selection = element.shadowRoot.getSelection().toString().trim();
                if (selection) return selection;
            }
        });

        // Check within iframes
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
            try {
                const iframeDoc = iframes[i].contentWindow.document;
                selection = iframeDoc.getSelection().toString().trim();
                if (selection) break;
            } catch (e) {
                console.log('Cannot access iframe due to cross-origin restrictions.');
            }
        }
    }

    return selection;
}

function getMaxRating(ratings) {
  if (ratings.length === 0) return null;
  
  max = ratings[0]['thumbsUpTotal'] - ratings[0]['thumbsDownTotal']
  ans = ratings[0]

  for(const rating of ratings){
    current = rating['thumbsUpTotal'] - rating['thumbsDownTotal']
    if(current > max){
      ans = rating
      max = current
    }
  }
  
  return ans
}
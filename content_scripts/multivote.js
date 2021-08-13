function getEventUuid() {
    return new Promise(resolve => {
        // get event id from hash in url
        let url = window.location.href;
        let matches = url.match(new RegExp("event\/(.*)\/live"));
        let eventHash = matches[1];

        $.ajax({
            url: `https://app.sli.do/api/v0.5/app/events?hash=${eventHash}`,
            success: function (data) {
                resolve(data.uuid);
            }
        });
    });
}

function getAuthToken(eventUuid) {
    return new Promise(resolve => {
        $.ajax({
            url: `https://app.sli.do/api/v0.5/events/${eventUuid}/auth`,
            method: "POST",
            success: function (data) {
                resolve(data.access_token)
            }
        });
    });
}

function addLike(eventUuid, authToken, questionId) {
    // appears to be rate limited so wait 2 seconds before making call
    setTimeout(() => {
        // console.log("event uuid: " + eventUuid + " questionId: " + questionId + " authToken: " + authToken);
        $.ajax({
            url: `https://app.sli.do/api/v0.5/events/${eventUuid}/questions/${questionId}/like`,
            method: "POST",
            headers: {Authorization: `Bearer ${authToken}`},
            data: { "score": 1 },
            success: function (data) {
                // console.log(data);
            },
            error: function (data) {
                console.log(data);
            }
        });
    }, 2000);
}

// poll until page content it loaded (this is because it's a react app so this script runs before the page has all the data loaded)
let scanningIntervalId = setInterval(() => {
    let questionContainers = document.getElementsByClassName("question-item");

    if (questionContainers.length > 0) {
        clearInterval(scanningIntervalId);

        getEventUuid().then(eventUuid => {
            for (let questionContainer of questionContainers) {
                let score_button = questionContainer.getElementsByClassName("score__btn")[0];
                let questionId = questionContainer.getAttribute("data-qid");

                // override button click handler so it does our stuff only
                score_button.addEventListener("click", function(event) {
                    getAuthToken(eventUuid).then(authToken => {
                        addLike(eventUuid, authToken, questionId);
                    });

                    // this stops it calling other event handlers
                    event.stopImmediatePropagation();
                }, true);
            }
        });
    }
}, 100);

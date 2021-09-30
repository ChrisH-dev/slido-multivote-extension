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

function sendLike(eventUuid, authToken, questionId, score) {
    // appears to be rate limited so wait 2 seconds before making call
    setTimeout(() => {
        // console.log("event uuid: " + eventUuid + " questionId: " + questionId + " authToken: " + authToken);
        $.ajax({
            url: `https://app.sli.do/api/v0.5/events/${eventUuid}/questions/${questionId}/like`,
            method: "POST",
            headers: {Authorization: `Bearer ${authToken}`},
            data: { "score": score },
            success: function (data) {
                // console.log(data);
            },
            error: function (data) {
                console.log(data);
            }
        });
    }, 2000);
}

function addThumbsUp(eventUuid, authToken, questionId) {
    sendLike(eventUuid, authToken, questionId, 1);
}

function addThumbsDown(eventUuid, authToken, questionId) {
    sendLike(eventUuid, authToken, questionId, -1);
}

const observer = new MutationObserver(function(mutations_list) {
    mutations_list.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(added_node) {

            if (added_node.classList.contains("question-list__item")) {
                let questionContainers = added_node.getElementsByClassName("question-item");

                if (questionContainers.length > 0) {
                    getEventUuid().then(eventUuid => {
                        console.log(eventUuid);
                        for (let questionContainer of questionContainers) {
                            let score_button_plus = questionContainer.getElementsByClassName("score__btn--plus")[0];
                            let score_button_minus = questionContainer.getElementsByClassName("score__btn--minus")[0];
                            let questionId = questionContainer.getAttribute("data-qid");

                            if (score_button_plus !== undefined) {
                                // override button click handler so it does our stuff only
                                score_button_plus.addEventListener("click", function (event) {
                                    getAuthToken(eventUuid).then(authToken => {
                                        addThumbsUp(eventUuid, authToken, questionId);
                                    });

                                    // this stops it calling other event handlers
                                    event.stopImmediatePropagation();
                                }, true);
                            }

                            if (score_button_minus !== undefined) {
                                score_button_minus.addEventListener("click", function (event) {
                                    getAuthToken(eventUuid).then(authToken => {
                                        addThumbsDown(eventUuid, authToken, questionId);
                                    });

                                    // this stops it calling other event handlers
                                    event.stopImmediatePropagation();
                                }, true);
                            }
                        }
                    });
                }

            }
        });
    });
});

observer.observe(document, { subtree: true, childList: true });

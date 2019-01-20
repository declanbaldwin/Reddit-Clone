$(document).ready(function() {
    $("#factsTab").addClass("selected");
    $("#factsTab").on("click", function() {
        $(this).addClass("selected");
        $("#opinionsTab").removeClass("selected");
        $("#experiencesTab").removeClass("selected");
        $(".opinionsPostsContainer").hide("slow");
        $(".experiencesPostsContainer").hide("slow");
        $(".newPostContainer").hide("slow");
        $(".searchPostsContainer").hide("slow");
        $(".factsPostsContainer").show("slow");
    });

    $("#opinionsTab").on("click", function() {
        $(this).addClass("selected");
        $("#factsTab").removeClass("selected");
        $("#experiencesTab").removeClass("selected");
        $(".factsPostsContainer").hide("slow");
        $(".experiencesPostsContainer").hide("slow");
        $(".newPostContainer").hide("slow");
        $(".searchPostsContainer").hide("slow");
        $(".opinionsPostsContainer").show("slow");
    });

    $("#experiencesTab").on("click", function() {
        $(this).addClass("selected");
        $("#factsTab").removeClass("selected");
        $("#opinionsTab").removeClass("selected");
        $(".factsPostsContainer").hide("slow");
        $(".opinionsPostsContainer").hide("slow");
        $(".newPostContainer").hide("slow");
        $(".searchPostsContainer").hide("slow");
        $(".experiencesPostsContainer").show("slow");
    });

    $(".newPostButton").on("click", function() {
        $("#factsTab").removeClass("selected");
        $("#opinionsTab").removeClass("selected");
        $("#experiencesTab").removeClass("selected");
        $(".factsPostsContainer").hide("slow");
        $(".opinionsPostsContainer").hide("slow");
        $(".experiencesPostsContainer").hide("slow");
        $(".searchPostsContainer").hide("slow");
        $(".newPostContainer").show("slow");
    });

    $(".signUpButton").on("click", function() {
        $("#loginSection").hide();
        $(".signUpButton").hide();
        $("#signUpSection").show();
        $(".signInButton").show();
    });

    $(".signInButton").on("click", function() {
        $("#signUpSection").hide();
        $(".signInButton").hide();
        $("#loginSection").show();
        $(".signUpButton").show();
    });

    $(".forgottenPasswordButton").on("click", function() {
        alert("oops, this doesn't do anything yet");
    });

    $(".upArrow").on("click", function() {
        let postID = this.parentElement.previousElementSibling.attributes.id
            .value;
        $.ajax({
            type: "POST",
            url: "http://localhost:3000/vote",
            data: {
                postID: postID,
                voteType: "up"
            },
            success: voteSuccessHandler
        });
    });

    $(".downArrow").on("click", function() {
        let postID = this.parentElement.previousElementSibling.attributes.id
            .value;
        $.ajax({
            type: "POST",
            url: "http://localhost:3000/vote",
            data: {
                postID: postID,
                voteType: "down"
            },
            success: voteSuccessHandler
        });
    });

    function voteSuccessHandler(data) {
        let postScore = document.getElementById(data.id).nextElementSibling;
        postScore.children[1].innerHTML = data.score;
        if (data.voteType == "up") {
            if (data.arrowColour == "red") {
                postScore.children[0].classList.add("red");
                postScore.children[2].classList.remove("red");
            } else {
                postScore.children[0].classList.remove("red");
                postScore.children[2].classList.remove("red");
            }
        }

        if (data.voteType == "down") {
            if (data.arrowColour == "red") {
                postScore.children[2].classList.add("red");
                postScore.children[0].classList.remove("red");
            } else {
                postScore.children[2].classList.remove("red");
                postScore.children[0].classList.remove("red");
            }
        }
    }

    $("#searchInput").keypress(function(event) {
        if (event.which !== 13) {
            return;
        }
        $("#factsTab").removeClass("selected");
        $("#opinionsTab").removeClass("selected");
        $("#experiencesTab").removeClass("selected");
        $(".factsPostsContainer").hide("slow");
        $(".opinionsPostsContainer").hide("slow");
        $(".experiencesPostsContainer").hide("slow");
        $(".newPostContainer").hide("slow");
        $(".searchPostsContainer").show("slow");

        console.log("enter pressed");
        let searchText = document.getElementById("searchInput").value;

        $.ajax({
            type: "POST",
            url: "http://localhost:3000/search",
            data: {
                searchText: searchText
            },
            success: searchSuccessHandler
        });
    });

    function searchSuccessHandler(data) {
        console.log("search success");
        $('.searchPostsContainer .posts').remove();
        let postHTML = createPostHTML(data);

        $(".searchPostsContainer").append(postHTML);
    }

    function createPostHTML(data) {
      let postHTML = "";
      for (let i = 0; i < data.posts.length; i++) {
          postHTML = postHTML + `<div class="posts">
    <div class="postsBody" id="${data.posts[i]._id}">
        <p>${data.posts[i].title}</p>
        <p>${data.posts[i].body}</p>
        <div class="postsInfo">
            <span>
            ${data.posts[i].author} - ${data.posts[i].createdAt}
            </span>
        </div>
    </div>
    <div class="postsScore">
        <p>${data.posts[i].score}</p>
    </div>
</div>`;
      }
      return postHTML;
    }
});

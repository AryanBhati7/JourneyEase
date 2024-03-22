function previewImage(event) {
    const fileInput = event.target;
    const imagePreviewContainer = document.getElementById("image-preview-container");
    imagePreviewContainer.innerHTML = "";

    for (const file of fileInput.files) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            imagePreviewContainer.appendChild(img);
        };

        reader.readAsDataURL(file);
    }
}

function submitPost() {
    // Implement the logic to submit the post with the selected image and text
    alert("Post submitted!");
}
const { BlobServiceClient } = require("@azure/storage-blob");

require("dotenv").config();


const createContainerButton = document.getElementById(
  "create-container-button"
);
const deleteContainerButton = document.getElementById(
  "delete-container-button"
);
const selectButton = document.getElementById("select-button");
const fileInput = document.getElementById("file-input");
const listButton = document.getElementById("list-button");
const deleteButton = document.getElementById("delete-button");
const status = document.getElementById("status");
const fileList = document.getElementById("file-list");

const reportStatus = (message) => {
  status.innerHTML += `${message}<br/>`;
  status.scrollTop = status.scrollHeight;
};

// Update <placeholder> with your Blob service SAS URL string
const blobSasUrl = process.env.BLOB_SAS_URL;

// Create a new BlobServiceClient
const blobServiceClient = new BlobServiceClient(blobSasUrl);

// Create a unique name for the container by
// appending the current time to the file name
const containerName = "coding" + new Date().getTime();

// Get a container client from the BlobServiceClient
const containerClient = blobServiceClient.getContainerClient(containerName);

const createContainer = async () => {
  try {
    reportStatus(`Creating container "${containerName}"...`);
    await containerClient.create();
    reportStatus(`Done. URL:${containerClient.url}`);
  } catch (error) {
    reportStatus(error.message);
  }
};

const deleteContainer = async () => {
  try {
    reportStatus(`Deleting container "${containerName}"...`);
    await containerClient.delete();
    reportStatus(`Done.`);
  } catch (error) {
    reportStatus(error.message);
  }
};

createContainerButton.addEventListener("click", createContainer);
deleteContainerButton.addEventListener("click", deleteContainer);

const listFiles = async () => {
  fileList.size = 0;
  fileList.innerHTML = "";
  try {
    reportStatus("Retrieving file list...");
    let iter = containerClient.listBlobsFlat();
    let blobItem = await iter.next();
    while (!blobItem.done) {
      fileList.size += 1;
      fileList.innerHTML += `<option>${blobItem.value.name}</option>`;

      blobItem = await iter.next();
    }
    if (fileList.size > 0) {
      reportStatus("Done.");
    } else {
      reportStatus("The container does not contain any files.");
    }
  } catch (error) {
    reportStatus(error.message);
  }
};

listButton.addEventListener("click", listFiles);

const uploadFiles = async () => {
  try {
    reportStatus("Uploading files...");
    const promises = [];
    for (const file of fileInput.files) {
      const blockBlobClient = containerClient.getBlockBlobClient(file.name);
      promises.push(blockBlobClient.uploadBrowserData(file));
    }
    await Promise.all(promises);
    reportStatus("Done.");
    listFiles();
  } catch (error) {
    reportStatus(error.message);
  }
};

selectButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", uploadFiles);

const deleteFiles = async () => {
  try {
    if (fileList.selectedOptions.length > 0) {
      reportStatus("Deleting files...");
      for (const option of fileList.selectedOptions) {
        await containerClient.deleteBlob(option.text);
      }
      reportStatus("Done.");
      listFiles();
    } else {
      reportStatus("No files selected.");
    }
  } catch (error) {
    reportStatus(error.message);
  }
};

deleteButton.addEventListener("click", deleteFiles);

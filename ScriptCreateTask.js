const SEWAKARTA_LIST = [
  "Mahavir Smarana Prabhuji",
  "Manohar Gaur Prabhuji",
  "Satya Madhav Prabhuji",
  "Shesha Sevaka Prabhuji",
  "Atul Gaur Sewa Prabhuji",
  "Kasturi Kesavi Mataji",
  "Balwan Hari Prabhuji",
  "Naresvara Hari Prabhuji",
  "Jagatabandhu Prabhuji",
  "Aravinda Nimai Prabhuji",
  "Hridaya Parmatma Prabhuji",
  "Saanta Nimai Prabhuji",
  "Lokatma Daksh Prabhuji",
  "Vibhu Caitanya Prabhuji",
  "Anant Achyuta Prabhuji",
  "Charu Chitra Sakhi Mataji",
  "Rishabh Karuna Mataji",
  "Padma Bhushan Prabhuji",
];
let GET_TASK_LIST_RESPONSE = [];
let TASK_MASTER = {};
let taskDueDays = 0;
let SF_MAP = {};
let selectedFile64String = "";
let selectedfile = "";
let selectedFileType = "";
let selectedFileName = "";

function convertRowsToTaskMaster(data) {
  const result = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const departmentType = row[1];
    const serviceType = row[2];
    const task = row[3];
    const owner = row[4];
    const reviewer = row[5];
    const dueDays = Number(row[6]) || "";

    // Department level
    if (!result[departmentType]) {
      result[departmentType] = {
        services: {},
      };
    }

    // Service Type level
    if (!result[departmentType].services[serviceType]) {
      result[departmentType].services[serviceType] = {
        tasks: [],
      };
    }

    // Task level
    result[departmentType].services[serviceType].tasks.push({
      task,
      owner,
      reviewer,
      dueDays,
    });
  }

  return result;
}

let behaviouralTask = [
  {
    task: "Student behavioural issues",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },
  {
    task: "Discipline monitoring",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },
];

function applyTaskSectionVisibility(category) {
  const loginType = selectedUser?.loginType;

  const normalDiv = document.getElementById("taskOwnerReviewerDiv");
  const behaviouralDiv = document.getElementById("behaviouralTaskDiv");
  const behaviouralOwnerDiv = document.getElementById(
    "behaviouralTaskDivReviewer",
  );

  // Hide everything by default
  normalDiv.style.display = "none";
  behaviouralDiv.style.display = "none";
  behaviouralOwnerDiv.style.display = "none";

  switch (loginType) {
    case "Sewakarta":
      taskListBtn.style.display = "block";

      // Nothing selected
      if (!category) return;

      if (category === "Behavioural Issues") {
        loadBehaviouralStudents();

        // Show Behavioural Section
        behaviouralDiv.style.display = "block";

        // Sewakarta can see Task Owner
        behaviouralOwnerDiv.style.display = "block";
      } else {
        // Normal Categories
        normalDiv.style.display = "block";
      }
      break;

    case "Parents":
      // Parents don't have task list
      taskListBtn.style.display = "none";

      if (!category) return;

      if (category === "Behavioural Issues") {
        loadBehaviouralStudents();

        // Show only student dropdown
        behaviouralDiv.style.display = "block";

        // Hide Task Owner
        behaviouralOwnerDiv.style.display = "none";
      } else {
        // Agar Parent ke liye normal categories bhi allowed hain
        normalDiv.style.display = "none";
      }
      break;

    default:
      taskListBtn.style.display = "none";
      break;
  }
}

async function createTaskBtnClick() {
  resetCreateTask();
  applyTaskSectionVisibility("");
  const response = await CALL_API_WITH_CACHE("GET_TASK_LIST", {});
  populateCreateTaskData(response);
}

async function callCreateBtnAPI() {
  resetCreateTask();
  applyTaskSectionVisibility("");
  const response = await CALL_API_WITH_CACHE("GET_TASK_LIST", {}, null, true); // always fresh refresh
  populateCreateTaskData(response);
}

function populateServiceTypes() {
  const selectedDepartment = departmentSelect.value;

  categorySelect.innerHTML = '<option value="">Choose Service Type</option>';

  taskButtonsContainer.innerHTML = "";
  taskDescription.value = "";
  taskOwner.value = "";
  taskReviewer.value = "";
  taskDueDays = "";

  applyTaskSectionVisibility("");

  if (!selectedDepartment) return;

  const departmentData = TASK_MASTER[selectedDepartment];

  if (!departmentData?.services) return;

  Object.keys(departmentData.services).forEach((serviceType) => {
    const option = document.createElement("option");

    option.value = serviceType;
    option.textContent = serviceType;

    categorySelect.appendChild(option);
  });
}

function populateCreateTaskData(response) {
  TASK_MASTER = convertRowsToTaskMaster(response?.data?.taskMasterResponse);

  SF_MAP = CREATE_MAP(
    response?.data?.stdDatabaseResponse,
    6,
    7,
    (row) => row[1] === "Y",
    (a, b) => a[0].localeCompare(b[0]),
  );

  if (TASK_MASTER["Gurukul"]?.services) {
    TASK_MASTER["Gurukul"].services["Behavioural Issues"] = {
      tasks: behaviouralTask,
    };
  }

  SET_DIV_TITLE("createTaskPopup", "Create Task");

  const departmentSelect = document.getElementById("departmentSelect");
  const categorySelect = document.getElementById("categorySelect");
  const taskButtonsContainer = document.getElementById("taskButtonsContainer");
  const taskDescription = document.getElementById("taskDescription");
  const taskOwner = document.getElementById("taskOwner");
  const taskReviewer = document.getElementById("taskReviewer");
  const taskList = document.getElementById("taskList");

  // Department Dropdown
  departmentSelect.innerHTML = "";

  const loginType = selectedUser?.loginType;

  Object.keys(TASK_MASTER).forEach((department) => {
    const option = document.createElement("option");

    option.value = department;
    option.textContent = department;

    departmentSelect.appendChild(option);
  });

  // Gurukul default
  if (TASK_MASTER["Gurukul"]) {
    departmentSelect.value = "Gurukul";
    populateServiceTypes();
  }

  // Parents -> Department fixed to Gurukul
  if (loginType === "Parents") {
    departmentSelect.value = "Gurukul";
    departmentSelect.disabled = true;
  } else {
    departmentSelect.disabled = false;
  }

  departmentSelect.addEventListener("change", populateServiceTypes);

  // Service Type Change
  categorySelect.addEventListener("change", () => {
    const selectedDepartment = departmentSelect.value;
    const selectedServiceType = categorySelect.value;

    applyTaskSectionVisibility(selectedServiceType);

    taskButtonsContainer.innerHTML = "";

    taskDescription.value = "";
    taskOwner.value = "";
    taskReviewer.value = "";
    taskDueDays = "";

    if (!selectedDepartment || !selectedServiceType) return;

    const serviceData =
      TASK_MASTER[selectedDepartment].services[selectedServiceType];

    serviceData.tasks.forEach((taskObj) => {
      const button = document.createElement("button");

      button.className = "task-btn";
      button.textContent = taskObj.task;

      button.addEventListener("click", () => {
        document.querySelectorAll(".task-btn").forEach((btn) => {
          btn.classList.remove("selected");
        });

        button.classList.add("selected");

        // Populate on task selection
        taskDescription.value = "";
        taskOwner.value = taskObj.owner;
        taskReviewer.value = taskObj.reviewer;
        taskDueDays = taskObj.dueDays;
      });

      taskButtonsContainer.appendChild(button);
    });
  });

  SHOW_SPECIFIC_DIV("createTaskPopup");
}

function loadBehaviouralStudents() {
  const studentSelect = document.getElementById("behaviouralSelect");
  const taskOwner = document.getElementById("behaviouralTaskOwner");

  studentSelect.innerHTML = '<option value="">Select Student</option>';

  taskOwner.value = "";

  Object.keys(SF_MAP).forEach((student) => {
    const option = document.createElement("option");
    option.value = student;
    option.textContent = student;

    studentSelect.appendChild(option);
  });

  studentSelect.onchange = function () {
    const selectedStudent = this.value;
    if (!selectedStudent) {
      taskOwner.value = "";
      return;
    }
    const owner = SF_MAP[selectedStudent];
    taskOwner.value = owner === "NA" ? "Disciplinary Team" : owner;
  };
}

function resetCreateTask() {
  // Reset dropdown
  document.getElementById("categorySelect").value = "";

  // Reset owner
  document.getElementById("taskOwner").value = "";

  document.getElementById("taskReviewer").value = "";

  // Reset description
  document.getElementById("taskDescription").value = "";

  // Reset task buttons
  document.getElementById("taskButtonsContainer").innerHTML = "";

  // Reset file input
  document.getElementById("ctUploadControl").value = "";

  // Reset preview image
  document.getElementById("imagePreview").src = "";

  // Hide preview container
  document.getElementById("imagePreviewContainer").style.display = "none";

  // Reset global variables
  selectedfile = null;

  selectedFile64String = "";
}

function backToMainScreenFromCreateTask() {
  resetCreateTask();
  SHOW_SPECIFIC_DIV("menuPopup");
}

function ctFetchFile() {
  const fileInput = document.getElementById("ctUploadControl");

  if (!fileInput) {
    console.error("File input not found");
    return;
  }

  const files = fileInput.files;

  if (files.length > 0) {
    const file = files[0];

    selectedfile = file;

    const reader = new FileReader();

    reader.onload = function (event) {
      const fullBase64 = event.target.result;

      const base64String = fullBase64.split(",")[1];

      selectedFile64String = base64String;

      // IMAGE PREVIEW
      const previewImage = document.getElementById("imagePreview");

      const previewContainer = document.getElementById("imagePreviewContainer");

      previewImage.src = fullBase64;

      previewContainer.style.display = "block";
    };

    reader.readAsDataURL(file);
  } else {
    console.log("No file selected");

    document.getElementById("imagePreviewContainer").style.display = "none";
  }
}

async function createNewTaskBtnClick() {
  const department = document.getElementById("departmentSelect").value;
  const category = document.getElementById("categorySelect").value;
  const description = document.getElementById("taskDescription").value.trim();

  const isBehavioural = category === "Behavioural Issues";

  // Normal task controls
  const owner = document.getElementById("taskOwner").value;
  const reviewer = document.getElementById("taskReviewer").value;

  // Behavioural task controls
  const behaviouralOwner = document.getElementById(
    "behaviouralTaskOwner",
  ).value;

  const studentName = document.getElementById("behaviouralSelect").value;

  if (!category) {
    SHOW_ERROR_POPUP("Please select category");
    return;
  }

  if (isBehavioural) {
    if (!studentName) {
      SHOW_ERROR_POPUP("Please select student");
      return;
    }

    if (!behaviouralOwner) {
      SHOW_ERROR_POPUP(
        "Please select a predefined behavioural task first before proceeding.",
      );
      return;
    }
  } else {
    if (!owner) {
      SHOW_ERROR_POPUP("Please select a sub category first before proceeding.");
      return;
    }
  }

  if (!description || description.trim().split(/\s+/).length < 5) {
    SHOW_ERROR_POPUP("Describe your task in at least 5 words.");
    return;
  }

  // Calculate Due Date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Number(taskDueDays));

  const taskDueDate =
    String(dueDate.getDate()).padStart(2, "0") +
    "/" +
    String(dueDate.getMonth() + 1).padStart(2, "0") +
    "/" +
    dueDate.getFullYear();

  const selectedBtn = document.querySelector(".task-btn.selected");

  const payload = {
    category: category,
    owner: isBehavioural ? behaviouralOwner : owner,
    reviewer: isBehavioural ? "" : reviewer,
    description: description,
    createdBy: selectedDevoteeName,
    studentName: isBehavioural ? studentName : "",
    selectedFile64String: selectedFile64String ?? "",
    selectedFileType: selectedfile?.type ?? "",
    selectedFileName: selectedfile?.name ?? "",
    dueDays: taskDueDays,
    dueDate: taskDueDate,
    department: department,
  };

  const response = await CALL_API("CREATE_TASK", payload);

  if (response?.status === "success") {
    const taskId = response?.data;
    SHOW_SUCCESS_POPUP(`Task Created Successfully. Task ID: ${taskId}`);
  }

  resetCreateTask();
}

//-------------------------------  Task List ---------------------------------------------- //

let taskList_allData = [];
let taskList_data = [];

// STATUS CLASS

function taskList_getStatusClass(status) {
  if (status === "Open") {
    return "taskList_open";
  }

  if (status === "In Review") {
    return "taskList_inreview";
  }

  if (status === "Due Date Ext Req") {
    return "taskList_extension_requested";
  }

  return "taskList_progress";
}

function formatExtensionRequestedDate(value) {
  if (!value) return "";

  const dateValue = String(value).trim();
  const dateParts = dateValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (dateParts) {
    const [, day, month, year] = dateParts;
    return formatDate(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
  }

  return formatDate(dateValue.slice(0, 10));
}

function taskList_renderTasks(tasks = taskList_data) {
  const taskListContainer = document.getElementById("taskList_taskList");

  taskListContainer.innerHTML = "";

  tasks.forEach((task) => {
    debugger;
    const extensionStatus = String(task.extStatus || "").trim();
    const extensionStatusKey = extensionStatus.toLowerCase();
    const canRequestExtension =
      ["Pending", "In Progress"].includes(task.status) &&
      task.actionOwnerName === selectedDevoteeName &&
      extensionStatusKey !== "pending";
    const canReviewExtension =
      extensionStatusKey === "pending" &&
      task.reviewerName === selectedDevoteeName;

    let actionButtons = "";

    if (task.status === "Due Date Ext Req") {
      actionButtons = `
        

        <button
          class="taskList_btn taskList_editBtn ${canReviewExtension ? "" : "taskList_btnDisabled"}"
          onclick="${canReviewExtension ? `reviewExtensionRequest('${task.taskId}', 'Rejected')` : ""}"
          ${canReviewExtension ? "" : "disabled"}>
          Reject Extension
        </button>
        <button
          class="taskList_btn taskList_closeBtn ${canReviewExtension ? "" : "taskList_btnDisabled"}"
          onclick="${canReviewExtension ? `reviewExtensionRequest('${task.taskId}', 'Approved')` : ""}"
          ${canReviewExtension ? "" : "disabled"}>
          Approve Extension
        </button>
      `;
    } else if (task.status === "In Review") {
      actionButtons = `
        <button
          class="taskList_btn taskList_editBtn ${task.canReview ? "" : "taskList_btnDisabled"}"
          onclick="${task.canReview ? `taskList_updateStatus('${task.taskId}', 'Move Back')` : ""}"
          ${task.canReview ? "" : "disabled"}>
          Move Back
        </button>

        <button
          class="taskList_btn taskList_closeBtn ${task.canReview ? "" : "taskList_btnDisabled"}"
          onclick="${task.canReview ? `taskList_updateStatus('${task.taskId}', 'Closed')` : ""}"
          ${task.canReview ? "" : "disabled"}>
          Close
        </button>
      `;
    } else {
      actionButtons = `
        <button
            class="taskList_btn taskList_viewBtn ${task.canReview ? "" : "taskList_btnDisabled"}"
            onclick="${canRequestExtension ? `openExtensionPopup('${task.taskId}')` : ""}"
            ${canRequestExtension ? "" : "disabled"}>
            Due Date Ext Req
        </button>

        <button
          class="taskList_btn taskList_editBtn ${task.canReview ? "" : "taskList_btnDisabled"}"
          onclick="${task.canReview ? `taskList_updateStatus('${task.taskId}', 'In Progress')` : ""}"
          ${task.canReview ? "" : "disabled"}>
          In Progress
        </button>

        <button
          class="taskList_btn taskList_closeBtn ${task.canReview ? "" : "taskList_btnDisabled"}"
          onclick="${task.canReview ? `taskList_updateStatus('${task.taskId}', 'In Review')` : ""}"
          ${task.canReview ? "" : "disabled"}>
          In Review
        </button>
      `;
    }

    if (canReviewExtension && task.status !== "Due Date Ext Req") {
      actionButtons += `
        <button
          class="taskList_btn taskList_closeBtn"
          onclick="reviewExtensionRequest('${task.taskId}', 'Approved')">
          Approve Extension
        </button>

        <button
          class="taskList_btn taskList_editBtn"
          onclick="reviewExtensionRequest('${task.taskId}', 'Rejected')">
          Reject Extension
        </button>
      `;
    }

    taskListContainer.innerHTML += `
      <div class="taskList_card">

        <!-- HEADER -->
        <div
          class="taskList_cardHeader"
          onclick="taskList_toggleAccordion(this)"
        >

          <div class="taskList_cardTop">

            <div class="taskList_title_div">

              <div class="taskList_title">
                ${(task.actionDescription || "")
                  .replace(/\r\n/g, "<br>")
                  .replace(/\n/g, "<br>")}
              </div>

              <span class="taskList_category">
                ${task.ticketFor}
              </span>

              <div class="taskList_status ${taskList_getStatusClass(task.status)}">
                ${task.status}
              </div>

            </div>

            <div class="taskList_right">
              <div class="taskList_accordionIcon">
                ▶
              </div>
            </div>

          </div>

        </div>

        <!-- CONTENT -->
        <div class="taskList_content">

          <div class="taskList_contentInner">

            <div class="taskList_details">

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Task Owner
                </div>

                <div class="taskList_detailValue">
                  ${task.actionOwnerName}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Task Reviewer
                </div>

                <div class="taskList_detailValue">
                  ${task.reviewerName}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Created By
                </div>

                <div class="taskList_detailValue">
                  ${task.createdBy}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Task Id
                </div>

                <div class="taskList_detailValue">
                  ${task.taskId}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Action Owner Comment
                </div>

                <div class="taskList_detailValue">
                  ${
                    task.remarks
                      ? task.remarks
                          .replace(/\r\n/g, "<br>")
                          .replace(/\n/g, "<br>")
                      : ""
                  }
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Reviewer Comment
                </div>

                <div class="taskList_detailValue">
                 ${
                   task.reviewerComment
                     ? task.reviewerComment
                         .replace(/\r\n/g, "<br>")
                         .replace(/\n/g, "<br>")
                     : ""
                 }
                </div>
              </div>


              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Due Date 
                </div>

                <div class="taskList_detailValue">
                  ${formatExtensionRequestedDate(task.dueDate)}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Ext Req Due Date
                </div>

                <div class="taskList_detailValue">
                  ${formatExtensionRequestedDate(task.extReqDueDate)}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Extension Status
                </div>

                <div class="taskList_detailValue">
                  ${extensionStatus || "Not Requested"}
                </div>
              </div>

              <div class="taskList_detailBox">
                <div class="taskList_detailTitle">
                  Extension Reason
                </div>

                <div class="taskList_detailValue">
                  ${(task.extReason || "").replace(/\r\n/g, "<br>").replace(/\n/g, "<br>")}
                </div>
              </div>



            </div>

            
            <div>
              <label class="taskList_commentLabel">
                Comment <span style="color:red">*</span>
              </label>

              <textarea
                id="taskComment_${task.taskId}"
                class="taskList_commentBox"
                placeholder="Enter your comment..."
              ></textarea>
            </div>

            <div class="button-row">

              ${
                task.uploadedImage
                  ? `
                    <button
                      class="taskList_btn taskList_viewBtn"
                      onclick="window.open('${task.uploadedImage}')"
                    >
                      View Attachment
                    </button>
                  `
                  : ""
              }

              ${actionButtons}

            </div>

          </div>

        </div>

      </div>
    `;
  });

  SHOW_SPECIFIC_DIV("taskListPopup");
}

function MoveToReview() {
  alert("Review clicked");
}

function taskList_toggleAccordion(element) {
  const allCards = document.querySelectorAll(".taskList_card");

  const currentCard = element.closest(".taskList_card");

  const isAlreadyOpen = currentCard.classList.contains("taskList_active");

  // CLOSE ALL

  allCards.forEach((card) => {
    card.classList.remove("taskList_active");
  });

  // OPEN CURRENT

  if (!isAlreadyOpen) {
    currentCard.classList.add("taskList_active");
  }
}

async function showTaskListPopup() {
  const response = await CALL_API("GET_ISSUE_TRACKERSHEET_DATA", {
    sheetName: "Pending Actions",
  });
  taskList_allData = CONVERT_ROWS_TO_OBJECTS(response?.data);
  taskList_data = [...taskList_allData];

  PrepareTaskListData();
  console.log("taskList_data", taskList_data);
  taskList_bindFilters();
  taskList_applyFilters();
  SET_DIV_TITLE("taskListPopup", "Task List");
}

function PrepareTaskListData() {
  taskList_data = taskList_allData
    // .filter((task) => task.ticketFor?.startsWith("ServiceApp"))
    .map((task) => {
      const status = task.status || "Pending";

      return {
        ...task,
        status,
        canReview:
          ((status === "Pending" || status === "In Progress") &&
            task.actionOwnerName === selectedDevoteeName) ||
          (status === "In Review" &&
            task.reviewerName === selectedDevoteeName) ||
          (status === "Due Date Ext Req" &&
            task.reviewerName === selectedDevoteeName),
      };
    });
}

function taskList_bindFilters() {
  const statusDDL = document.getElementById("taskStatusFilter");
  const serviceDDL = document.getElementById("taskServiceFilter");
  const ownerDDL = document.getElementById("taskOwnerFilter");

  // Get unique Statuses
  const statuses = [...new Set(taskList_data.map((x) => x.status))].sort();

  // Get unique Services
  const services = [...new Set(taskList_data.map((x) => x.ticketFor))].sort();

  // Get unique Owners & Reviewers
  let owners = [
    ...new Set(
      taskList_data.flatMap((x) => [x.actionOwnerName, x.reviewerName]),
    ),
  ]
    .filter(Boolean)
    .sort();

  // Keep current devotee at top
  if (selectedDevoteeName) {
    owners = [
      selectedDevoteeName,
      ...owners.filter((x) => x !== selectedDevoteeName),
    ];
  }

  // Reset dropdowns
  statusDDL.innerHTML = '<option value="All">All</option>';
  serviceDDL.innerHTML = '<option value="All">All</option>';
  ownerDDL.innerHTML = '<option value="All">All</option>';

  // Bind Status
  statuses.forEach((status) => {
    statusDDL.innerHTML += `<option value="${status}">${status}</option>`;
  });

  // Bind Service
  services.forEach((service) => {
    serviceDDL.innerHTML += `<option value="${service}">${service}</option>`;
  });

  // Bind Owners
  owners.forEach((owner) => {
    ownerDDL.innerHTML += `<option value="${owner}">${owner}</option>`;
  });

  // Default selected owner
  if (selectedDevoteeName) {
    ownerDDL.value = selectedDevoteeName;
  }

  // Initial render using current filters
  taskList_applyFilters();
}

function taskList_applyFilters() {
  const status = document.getElementById("taskStatusFilter").value;
  const service = document.getElementById("taskServiceFilter").value;
  const owner = document.getElementById("taskOwnerFilter").value;
  const search = document
    .getElementById("taskSearch")
    .value.trim()
    .toLowerCase();

  const filtered = taskList_data.filter((task) => {
    // Status Filter
    if (status !== "All" && task.status !== status) {
      return false;
    }

    // Service Filter
    if (service !== "All" && task.ticketFor !== service) {
      return false;
    }

    // Owner Filter
    if (owner !== "All") {
      const taskOwner = ["In Review", "Due Date Ext Req"].includes(task.status)
        ? task.reviewerName || ""
        : task.actionOwnerName || "";

      if (taskOwner !== owner) {
        return false;
      }
    }

    // Search Filter
    if (search) {
      const searchableText = [
        task.actionDescription || "",
        task.ticketFor || "",
        task.actionOwnerName || "",
        task.reviewerName || "",
        task.status || "",
        task.createdBy || "",
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(search)) {
        return false;
      }
    }

    return true;
  });

  console.log("Selected Owner:", owner);
  console.log("Filtered Count:", filtered.length);

  taskList_renderTasks(filtered);
}

async function taskList_updateStatus(taskId, newStatus) {
  const comment = document.getElementById(`taskComment_${taskId}`).value.trim();

  if (!comment) {
    SHOW_INFO_POPUP("Please enter a comment.");
    return;
  }

  // Find the actual task from the master dataset
  const task = taskList_data.find((x) => String(x.taskId) === String(taskId));

  if (!task) {
    SHOW_ERROR_POPUP("Task not found.");
    return;
  }

  const request = {
    taskId: task.taskId,
    comment,
    status: newStatus,
  };

  const response = await CALL_API("UPDATE_TASK_STATUS", request);

  if (response?.status) {
    // Update local data
    switch (newStatus) {
      case "Move Back":
        task.status = "In Progress";
        task.reviewerComment = comment;
        break;

      case "Closed":
        task.status = "Closed";
        task.reviewerComment = comment;
        break;

      default:
        task.status = newStatus;
        task.remarks = comment;
        break;
    }

    // Recalculate canReview because status has changed
    task.canReview =
      ((task.status === "Pending" || task.status === "In Progress") &&
        task.actionOwnerName === selectedDevoteeName) ||
      (task.status === "In Review" &&
        task.reviewerName === selectedDevoteeName);

    SHOW_SUCCESS_POPUP("Task updated successfully.");

    // Refresh UI
    taskList_applyFilters();
  }
}

async function myTaskButtonClick() {
  const response = await CALL_API("GET_ALL_TASK_SHEET_DATA", {});
  const filterData = getFilteredActions(response?.data, selectedUser?.filterBy);

  fillDynamicTableRows(filterData, "fmTableTHead", "fmTableTBody", [], {
    enableSearch: true,
    enableSorting: true,
    searchPlaceholder: "Search task...",
    isFileNameThere: false,
    isFileURLThere: false,
    enableRowCount: true,
  });

  SHOW_SPECIFIC_DIV("myTaskContainer");
}

function getFilteredActions(actionsData, loginPerson) {
  const result = [["Status", "Date", "Action Description", "Comment"]];

  const pendingActions = actionsData["Pending Actions"] || [];

  pendingActions.slice(1).forEach((row) => {
    // 10th column = J = Created By
    const createdByValue = String(row[9] || "");

    if (createdByValue.includes(String(loginPerson))) {
      result.push([
        row[0], // Status
        row[3], // Date
        row[4], // Action Description
        row[1], // Comment / Remarks
      ]);
    }
  });

  const closedActions = actionsData["Closed Actions"] || [];

  closedActions.slice(1).forEach((row) => {
    const createdByValue = String(row[9] || "");

    if (createdByValue.includes(String(loginPerson))) {
      result.push([
        "Closed", // Status
        row[0], // Date
        row[2], // Action Description
        row[6], // Closure Remarks
      ]);
    }
  });

  return result;
}

function backToMainMenu() {
  SHOW_SPECIFIC_DIV("menuPopup");
}

// Current task information

let extensionTask = null;

function getTaskDueDate(task) {
  const dueDate = String(task?.dueDate || "").trim();

  if (!dueDate) return "";

  const dateParts = dueDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!dateParts) return "";

  const [, day, month, year] = dateParts;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Open Popup

function openExtensionPopup(taskId) {
  debugger;
  const task = taskList_data.find(
    (item) => String(item.taskId) === String(taskId),
  );

  if (!task) {
    SHOW_ERROR_POPUP("Task not found.");
    return;
  }

  const previousDueDate = getTaskDueDate(task);
  if (!previousDueDate) {
    SHOW_ERROR_POPUP("This task does not contain a valid due date.");
    return;
  }

  extensionTask = {
    taskId: task.taskId,
    taskName: task.actionDescription || task.taskName || "",
    department: task.department || task.departmentType || "",
    category: task.ticketFor || task.category || "",
    previousDueDate,
  };

  SHOW_SPECIFIC_DIV("extensionPopup");

  // Populate task information
  document.getElementById("extensionTaskName").textContent =
    extensionTask.taskName;

  document.getElementById("extensionDepartment").textContent =
    extensionTask.department;

  document.getElementById("extensionCategory").textContent =
    extensionTask.category;

  // Format previous date
  document.getElementById("previousDueDate").textContent = formatDate(
    extensionTask.previousDueDate,
  );

  // Reset fields
  document.getElementById("newDueDate").value = "";
  document.getElementById("extensionReason").value = "";
  document.getElementById("dateError").textContent = "";

  const today = new Date();
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const nextDayAfterPreviousDueDate = new Date(
    `${extensionTask.previousDueDate}T00:00:00Z`,
  );
  nextDayAfterPreviousDueDate.setUTCDate(
    nextDayAfterPreviousDueDate.getUTCDate() + 1,
  );

  const earliestAllowedDate = nextDayAfterPreviousDueDate
    .toISOString()
    .slice(0, 10);

  document.getElementById("newDueDate").min =
    earliestAllowedDate > todayDate ? earliestAllowedDate : todayDate;
}

// Close Popup

function closeExtensionPopup() {
  SHOW_SPECIFIC_DIV("taskListPopup");
}

// Request Extension

async function requestExtension() {
  if (!extensionTask) {
    SHOW_ERROR_POPUP("Please select a task first.");
    return;
  }

  const newDate = document.getElementById("newDueDate").value;

  const reason = document.getElementById("extensionReason").value.trim();

  const error = document.getElementById("dateError");

  // Validate date
  if (!newDate) {
    error.textContent = "Please select a new due date.";

    return;
  }

  // New date should be greater than previous date
  if (newDate <= extensionTask.previousDueDate) {
    error.textContent = "New due date must be after the previous due date.";

    return;
  }

  error.textContent = "";

  // Data that you can send to backend
  const requestData = {
    taskId: extensionTask.taskId,
    extStatus: "Pending",
    extReqDueDate: newDate,
    extReason: reason,
    requestedBy: selectedDevoteeName,
  };

  const response = await CALL_API("REQUEST_DUE_DATE_EXTENSION", requestData);

  if (!response?.status) return;

  const task = taskList_data.find(
    (item) => String(item.taskId) === String(extensionTask.taskId),
  );

  if (task) {
    task.status = "Due Date Ext Req";
    task.extStatus = "Pending";
    task.extReqDueDate = newDate;
    task.extReason = reason;
  }

  closeExtensionPopup();
  SHOW_SUCCESS_POPUP("Due date extension request submitted successfully.");
}

async function reviewExtensionRequest(taskId, decision) {
  const task = taskList_data.find(
    (item) => String(item.taskId) === String(taskId),
  );

  if (!task) {
    SHOW_ERROR_POPUP("Task not found.");
    return;
  }

  if (
    String(task.extStatus || "")
      .trim()
      .toLowerCase() !== "pending" ||
    task.reviewerName !== selectedDevoteeName
  ) {
    SHOW_ERROR_POPUP("You are not allowed to review this extension request.");
    return;
  }

  const response = await CALL_API(API_TYPE_CONSTANT.REVIEW_DUE_DATE_EXTENSION, {
    taskId: task.taskId,
    extStatus: decision,
    reviewedBy: selectedDevoteeName,
    requestedDueDate: task.extReqDueDate,
  });

  if (!response?.status) return;

  task.status = "Pending";
  task.extStatus = decision;
  taskList_applyFilters();
  SHOW_SUCCESS_POPUP(`Extension request ${decision.toLowerCase()}.`);
}

// Date Formatting

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Close when clicking outside modal

document
  .getElementById("extensionPopup")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      closeExtensionPopup();
    }
  });

// ESC key closes popup

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeExtensionPopup();
  }
});

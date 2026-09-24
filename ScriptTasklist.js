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

function getTaskDueDateInfo(dueDate) {
  if (!dueDate) {
    return {
      text: "No Due Date",
      className: "taskList_due_none",
    };
  }

  const parts = String(dueDate).trim().split("/");

  if (parts.length !== 3) {
    return {
      text: "Invalid Due Date",
      className: "taskList_due_none",
    };
  }

  const due = new Date(
    Number(parts[2]),
    Number(parts[1]) - 1,
    Number(parts[0]),
  );

  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  let statusText = "";
  let className = "";

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    statusText = `Overdue by ${days} day${days === 1 ? "" : "s"}`;
    className = "taskList_due_overdue";
  } else if (diffDays === 0) {
    statusText = "Due Today";
    className = "taskList_due_today";
  } else if (diffDays === 1) {
    statusText = "Due Tomorrow";
    className = "taskList_due_tomorrow";
  } else {
    statusText = `Due in ${diffDays} days`;
    className = "taskList_due_upcoming";
  }

  return {
    text: `Due Date: ${dueDate} · ${statusText}`,
    className,
  };
}

function taskList_renderTasks(tasks = taskList_data) {
  const taskListContainer = document.getElementById("taskList_taskList");

  taskListContainer.innerHTML = "";

  tasks.forEach((task) => {
    const dueDateInfo = getTaskDueDateInfo(task.dueDate);
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

              <div class="taskList_dueDate ${dueDateInfo.className}">
                ${dueDateInfo.text}
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
  taskList_data = taskList_allData.map((task) => {
    const status = task.status || "Pending";

    return {
      ...task,
      status,
      canReview:
        ((status === "Pending" || status === "In Progress") &&
          task.actionOwnerName === selectedDevoteeName) ||
        ((status === "In Review" || status === "Due Date Ext Req") &&
          (task.reviewerName === selectedDevoteeName ||
            task.actionOwnerName === selectedDevoteeName)),
    };
  });
}

function taskList_bindFilters() {
  const dueDateDDL = document.getElementById("taskDueDateFilter");
  const statusDDL = document.getElementById("taskStatusFilter");
  const serviceDDL = document.getElementById("taskServiceFilter");
  const ownerDDL = document.getElementById("taskOwnerFilter");

  dueDateDDL.addEventListener("change", taskList_applyFilters);

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

function taskList_checkDueDateFilter(dueDate, filter) {
  if (filter === "All") return true;

  if (!dueDate) {
    return filter === "NoDueDate";
  }

  const parts = String(dueDate).trim().split("/");

  if (parts.length !== 3) return false;

  const due = new Date(
    Number(parts[2]),
    Number(parts[1]) - 1,
    Number(parts[0]),
  );

  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  switch (filter) {
    case "Overdue":
      return diffDays < 0;

    case "Today":
      return diffDays === 0;

    case "Tomorrow":
      return diffDays === 1;

    case "Next2Days":
      return diffDays >= 1 && diffDays <= 2;

    case "NextWeek":
      return diffDays >= 1 && diffDays <= 7;

    case "Later":
      return diffDays > 7;

    case "NoDueDate":
      return false;

    default:
      return true;
  }
}

function taskList_applyFilters() {
  const status = document.getElementById("taskStatusFilter").value;
  const service = document.getElementById("taskServiceFilter").value;
  const owner = document.getElementById("taskOwnerFilter").value;
  const dueDateFilter = document.getElementById("taskDueDateFilter").value;

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

    // Due Date Filter
    if (!taskList_checkDueDateFilter(task.dueDate, dueDateFilter)) {
      return false;
    }

    // Owner Filter
    // Owner Filter
    if (owner !== "All") {
      const isReviewStatus = ["In Review", "Due Date Ext Req"].includes(
        task.status,
      );

      if (isReviewStatus) {
        const isOwner =
          task.actionOwnerName === owner || task.reviewerName === owner;

        if (!isOwner) {
          return false;
        }
      } else {
        if (task.actionOwnerName !== owner) {
          return false;
        }
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

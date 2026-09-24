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
let selectedTaskObj = null;

function convertRowsToTaskMaster(data, loginType) {
  try {
    const result = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      const departmentType = row[7];
      const serviceType = row[2];

      const taskObj = {
        task: row[3],
        owner: row[4],
        reviewer: row[5],
        dueDays: Number(row[6]) || "",
        whatsappGroup: row[7] || "",
        isVisiableFor: row[8] || "",
      };

      // Visibility check
      if (!isTaskVisibleForLoginType(taskObj, loginType)) {
        continue;
      }

      // Department
      if (!result[departmentType]) {
        result[departmentType] = {
          services: {},
        };
      }

      // Service
      if (!result[departmentType].services[serviceType]) {
        result[departmentType].services[serviceType] = {
          tasks: [],
        };
      }

      // Task
      result[departmentType].services[serviceType].tasks.push(taskObj);
    }

    return result;
  } catch (error) {
    SHOW_ERROR_POPUP(error.message);
  }
}

function isTaskVisibleForLoginType(taskObj, loginType) {
  const visibleFor = (taskObj.isVisiableFor || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  // Blank = everyone
  if (visibleFor.length === 0) {
    return true;
  }

  return visibleFor.includes(loginType);
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

let stdCareTask = [
  {
    task: "Student Health Issues",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },

  {
    task: "Health Checkup Follow-up",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },

  {
    task: "Parent Meeting",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },

  {
    task: "Cloth Management",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },

  {
    task: "Quality and Time of Prasadam",
    owner: "",
    reviewer: "",
    dueDays: 2,
  },

  {
    task: "Personal Need (Oil, Soap etc.)",
    owner: "",
    reviewer: "",
    dueDays: 1,
  },
];

function applyTaskSectionVisibility(category) {
  const loginType = selectedUser?.loginType;

  const normalDiv = document.getElementById("taskOwnerReviewerDiv");
  const behaviouralDiv = document.getElementById("behaviouralTaskDiv");
  const behaviouralOwnerDiv = document.getElementById(
    "behaviouralTaskDivReviewer",
  );

  const stdCareDiv = document.getElementById("stdCareTaskDiv");
  const stdCareReviewerDiv = document.getElementById("stdCareTaskDivReviewer");

  // Hide everything by default
  normalDiv.style.display = "none";
  behaviouralDiv.style.display = "none";
  behaviouralOwnerDiv.style.display = "none";
  stdCareDiv.style.display = "none";
  stdCareReviewerDiv.style.display = "none";

  switch (loginType) {
    case "Sewakarta":
      taskListBtn.style.display = "block";

      // Nothing selected
      if (!category) return;

      if (category === "Behavioural Issues") {
        // Show Behavioural Section
        behaviouralDiv.style.display = "block";

        // Sewakarta can see Task Owner / Reviewer
        behaviouralOwnerDiv.style.display = "block";
      } else if (category === "Student Care") {
        stdCareDiv.style.display = "block";
        stdCareReviewerDiv.style.display = "block";
      } else {
        // Normal Categories
        normalDiv.style.display = "block";
      }

      break;

    case "Parents":
      // Parents don't have task list
      taskListBtn.style.display = "none";

      if (!category) return;

      if (category === "Student Care") {
        stdCareDiv.style.display = "block";
        stdCareReviewerDiv.style.display = "none";
      } else if (category === "Behavioural Issues") {
        // Parents are NOT allowed to create Behavioural Issues tasks
        return;
      } else {
        // Parents can create other normal categories
        normalDiv.style.display = "block";
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
  const loginType = selectedUser?.loginType;

  // Build TASK_MASTER according to current login type
  TASK_MASTER = convertRowsToTaskMaster(
    response?.data?.taskMasterResponse,
    loginType,
  );

  SF_MAP = CREATE_MAP(
    response?.data?.stdDatabaseResponse,
    6,
    7,
    (row) => row[1] === "Y",
    (a, b) => a[0].localeCompare(b[0]),
  );

  const data = Object.keys(SF_MAP || {});

  //initialize live search for student behvioural list.
  setupLiveSearch(
    "stdBehavInput",
    "stdBehavInputClrBtn",
    "stdBehavInputULList",
    function (selectedText) {
      selectedBehavStdName = selectedText;
      const taskOwner = document.getElementById("behaviouralTaskOwner");
      if (selectedBehavStdName) {
        taskOwner.value = "";
        const owner = SF_MAP[selectedBehavStdName];
        taskOwner.value = owner === "NA" ? "Disciplinary Team" : owner;
      } else {
        taskOwner.value = "";
      }
    },
  );

  initializedLiveSearchControl(
    "stdBehavInput",
    "stdBehavInputClrBtn",
    "stdBehavInputULList",
    data,
  );

  //initialize live search for student care list.
  setupLiveSearch(
    "stdCareInput",
    "stdCareInputClrBtn",
    "stdCareInputULList",
    function (selectedText) {
      selectedCareStdName = selectedText;
      const taskOwner = document.getElementById("stdCareTaskOwner");
      if (selectedCareStdName) {
        taskOwner.value = "";
        const owner = SF_MAP[selectedCareStdName];
        taskOwner.value = owner === "NA" ? "Disciplinary Team" : owner;
      } else {
        taskOwner.value = "";
      }
    },
  );

  initializedLiveSearchControl(
    "stdCareInput",
    "stdCareInputClrBtn",
    "stdCareInputULList",
    data,
  );

  // Behavioural Issues is only available for Sewakarta
  if (loginType === "Sewakarta" && TASK_MASTER["Gurukul"]?.services) {
    TASK_MASTER["Gurukul"].services["Behavioural Issues"] = {
      tasks: behaviouralTask,
    };
  }

  // Student Care Issues
  if (TASK_MASTER["Gurukul"]?.services) {
    TASK_MASTER["Gurukul"].services["Student Care"] = {
      tasks: stdCareTask,
    };
  }

  SET_DIV_TITLE("createTaskPopup", "Create Task");

  const departmentSelect = document.getElementById("departmentSelect");
  const categorySelect = document.getElementById("categorySelect");
  const taskButtonsContainer = document.getElementById("taskButtonsContainer");
  const taskDescription = document.getElementById("taskDescription");
  const taskOwner = document.getElementById("taskOwner");
  const taskReviewer = document.getElementById("taskReviewer");

  // Reset selected task whenever popup is populated
  selectedTaskObj = null;

  // Department Dropdown
  departmentSelect.innerHTML = "";

  Object.keys(TASK_MASTER).forEach((department) => {
    const option = document.createElement("option");

    option.value = department;
    option.textContent = department;

    departmentSelect.appendChild(option);
  });

  // Populate Service Types
  function populateServiceTypes() {
    categorySelect.innerHTML = "";

    const selectedDepartment = departmentSelect.value;

    if (!selectedDepartment) return;

    const services = TASK_MASTER[selectedDepartment]?.services || {};

    Object.keys(services).forEach((serviceType) => {
      const option = document.createElement("option");

      option.value = serviceType;
      option.textContent = serviceType;

      categorySelect.appendChild(option);
    });

    // Trigger service selection
    categorySelect.dispatchEvent(new Event("change"));
  }

  // --------------------------------------------------
  // Default Department
  // --------------------------------------------------

  if (TASK_MASTER["Gurukul"]) {
    departmentSelect.value = "Gurukul";
    populateServiceTypes();
  } else if (departmentSelect.options.length > 0) {
    departmentSelect.selectedIndex = 0;
    populateServiceTypes();
  }

  // --------------------------------------------------
  // Parents -> Gurukul
  // --------------------------------------------------

  if (loginType === "Parents" && TASK_MASTER["Gurukul"]) {
    departmentSelect.value = "Gurukul";
    // departmentSelect.disabled = true;
    populateServiceTypes();
  } else {
    departmentSelect.disabled = false;
  }

  // --------------------------------------------------
  // Department Change
  // --------------------------------------------------

  departmentSelect.addEventListener("change", populateServiceTypes);

  // --------------------------------------------------
  // Service Type Change
  // --------------------------------------------------

  categorySelect.addEventListener("change", () => {
    const selectedDepartment = departmentSelect.value;
    const selectedServiceType = categorySelect.value;

    applyTaskSectionVisibility(selectedServiceType);

    taskButtonsContainer.innerHTML = "";

    taskDescription.value = "";
    taskOwner.value = "";
    taskReviewer.value = "";
    taskDueDays = "";

    // Clear previously selected task
    selectedTaskObj = null;

    if (!selectedDepartment || !selectedServiceType) return;

    const serviceData =
      TASK_MASTER[selectedDepartment]?.services?.[selectedServiceType];

    if (!serviceData) return;

    serviceData.tasks.forEach((taskObj) => {
      const button = document.createElement("button");

      button.className = "task-btn";
      button.textContent = taskObj.task;

      button.addEventListener("click", () => {
        document.querySelectorAll(".task-btn").forEach((btn) => {
          btn.classList.remove("selected");
        });

        button.classList.add("selected");

        // Store complete selected task object
        selectedTaskObj = taskObj;

        // Populate task details
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

function resetCreateTask() {
  // Reset dropdown
  document.getElementById("categorySelect").value = "";

  // Reset normal owner/reviewer
  document.getElementById("taskOwner").value = "";
  document.getElementById("taskReviewer").value = "";

  // Reset Behavioural live search selection
  document.getElementById("stdBehavInput").value = "";
  document.getElementById("stdBehavInputClrBtn").style.display = "none";
  document.getElementById("behaviouralTaskOwner").value = "";
  selectedBehavStdName = "";

  // Reset Student Care live search selection
  document.getElementById("stdCareInput").value = "";
  document.getElementById("stdCareInputClrBtn").style.display = "none";
  document.getElementById("stdCareTaskOwner").value = "";
  selectedCareStdName = "";

  // Reset description
  document.getElementById("taskDescription").value = "";

  // Reset task buttons
  document.getElementById("taskButtonsContainer").innerHTML = "";

  // Reset file input
  document.getElementById("ctUploadControl").value = "";

  // Reset preview image
  document.getElementById("imagePreview").src = "";
  document.getElementById("imagePreviewContainer").style.display = "none";

  // Reset global variables
  selectedfile = null;
  selectedFile64String = "";
  selectedTaskObj = null;
  taskDueDays = "";

  // Reset section visibility
  applyTaskSectionVisibility("");
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
  const isStudentCare = category === "Student Care";

  // Normal task controls
  const owner = document.getElementById("taskOwner").value;
  const reviewer = document.getElementById("taskReviewer").value;

  // Behavioural task controls
  const behaviouralOwner = document.getElementById(
    "behaviouralTaskOwner",
  ).value;

  // Student Care task controls
  const stdCareOwner = document.getElementById("stdCareTaskOwner").value;

  if (!category) {
    SHOW_ERROR_POPUP("Please select category");
    return;
  }

  // Behavioural Issues
  if (isBehavioural) {
    if (!selectedBehavStdName) {
      SHOW_ERROR_POPUP("Please select student");
      return;
    }

    if (!behaviouralOwner) {
      SHOW_ERROR_POPUP(
        "Please select a predefined behavioural task first before proceeding.",
      );
      return;
    }
  }

  // Student Care
  else if (isStudentCare) {
    if (!selectedCareStdName) {
      SHOW_ERROR_POPUP("Please select student");
      return;
    }

    if (!stdCareOwner) {
      SHOW_ERROR_POPUP(
        "Please select a predefined std care task first before proceeding.",
      );
      return;
    }
  }

  // Normal Task
  else {
    if (!owner) {
      SHOW_ERROR_POPUP("Please select a sub category first before proceeding.");
      return;
    }
  }

  // Description validation
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

  const selectedOwner = isBehavioural
    ? behaviouralOwner
    : isStudentCare
      ? stdCareOwner
      : owner;

  const updatedOwner =
    selectedOwner === "Disciplinary Team"
      ? "Charu Chitra Sakhi Mataji"
      : selectedOwner;

  // --------------------------------------------------
  // Reviewer
  // Behavioural + Student Care → Owner is Reviewer
  // Normal task → Selected Reviewer
  // --------------------------------------------------

  const updatedReviewer =
    isBehavioural || isStudentCare ? updatedOwner : reviewer;

  // --------------------------------------------------
  // WhatsApp Group
  // --------------------------------------------------

  let whatsappGroup = "";

  if (isBehavioural || isStudentCare) {
    whatsappGroup =
      selectedOwner === "Disciplinary Team"
        ? "GurukulInviligationDisciplinaryTeam"
        : "GurukulExternal";
  } else {
    whatsappGroup = selectedTaskObj?.whatsappGroup || "";
  }

  const payload = {
    task: selectedTaskObj?.task || "",
    category: category,

    owner: updatedOwner,

    reviewer: updatedReviewer,

    description: description,

    createdBy: selectedDevoteeName,

    studentName:
      isBehavioural || isStudentCare
        ? isBehavioural
          ? selectedBehavStdName
          : selectedCareStdName
        : "",

    selectedFile64String: selectedFile64String ?? "",

    selectedFileType: selectedfile?.type ?? "",

    selectedFileName: selectedfile?.name ?? "",

    dueDays: taskDueDays,

    dueDate: taskDueDate,

    department: department,

    whatsappGroup: whatsappGroup,
  };

  const response = await CALL_API("CREATE_TASK", payload);

  if (response?.status) {
    const taskId = response?.data;
    SHOW_SUCCESS_POPUP(`Task Created Successfully. Task ID: ${taskId}`);
  }

  resetCreateTask();
}

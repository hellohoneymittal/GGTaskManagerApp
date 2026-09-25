function showAdhocCreateTaskPopup() {}

const ADHOC_DEPARTMENT_MAP = {
  Congregation: "Seva_Focus_Group",
  Gurukul: "Gurukul_task_management",
  GurukulAdmin: "GG_exam_curriculam_dept",
  GurukulExternal: "Gurukul_Servants",
  GurukulInviligationDisciplinaryTeam: "Inviligation_and_disciplinary_Team",
};

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

function adhocInitializeCreateTask() {
  const departmentSelect = document.getElementById("adhocDepartmentSelect");

  const taskOwner = document.getElementById("adhocTaskOwner");
  const taskReviewer = document.getElementById("adhocTaskReviewer");

  // Department
  departmentSelect.innerHTML = "";

  Object.entries(ADHOC_DEPARTMENT_MAP).forEach(([department, displayName]) => {
    const option = document.createElement("option");

    option.value = department;
    option.textContent = displayName;

    departmentSelect.appendChild(option);
  });

  // Owner
  taskOwner.innerHTML = '<option value="">Select Task Owner</option>';

  SEWAKARTA_LIST.forEach((name) => {
    const option = document.createElement("option");

    option.value = name;
    option.textContent = name;

    taskOwner.appendChild(option);
  });

  // Reviewer
  taskReviewer.innerHTML = '<option value="">Select Task Reviewer</option>';

  SEWAKARTA_LIST.forEach((name) => {
    const option = document.createElement("option");

    option.value = name;
    option.textContent = name;

    taskReviewer.appendChild(option);
  });

  adhocResetCreateTask();

  SHOW_SPECIFIC_DIV("adhocCreateTaskPopup");
}

async function adhocCreateTaskSubmit() {
  const department = document.getElementById("adhocDepartmentSelect").value;

  const category = document.getElementById("adhocCategory").value.trim();

  const owner = document.getElementById("adhocTaskOwner").value;

  const reviewer = document.getElementById("adhocTaskReviewer").value;

  const description = document
    .getElementById("adhocTaskDescription")
    .value.trim();

  if (!department) {
    SHOW_ERROR_POPUP("Please select department.");
    return;
  }

  if (!category) {
    SHOW_ERROR_POPUP("Please enter category.");
    return;
  }

  if (!owner) {
    SHOW_ERROR_POPUP("Please select task owner.");
    return;
  }

  if (!reviewer) {
    SHOW_ERROR_POPUP("Please select task reviewer.");
    return;
  }

  if (!description || description.split(/\s+/).length < 5) {
    SHOW_ERROR_POPUP("Describe your task in at least 5 words.");
    return;
  }

  const payload = {
    department: department,
    category: category,
    owner: owner,
    reviewer: reviewer,
    description: description,
    createdBy: selectedDevoteeName,

    selectedFile64String: adhocSelectedFile64String ?? "",
    selectedFileType: adhocSelectedFile?.type ?? "",
    selectedFileName: adhocSelectedFile?.name ?? "",
  };

  const response = await CALL_API("CREATE_ADHOC_TASK", payload);

  if (response?.status) {
    const taskId = response?.data || "";

    SHOW_SUCCESS_POPUP(
      `Task Created Successfully${taskId ? `. Task ID: ${taskId}` : ""}`,
    );

    adhocResetCreateTask();
  }
}

let adhocSelectedFile = null;
let adhocSelectedFile64String = "";

function adhocFetchFile() {
  const fileInput = document.getElementById("adhocUploadControl");

  const file = fileInput.files?.[0];

  if (!file) {
    adhocSelectedFile = null;
    adhocSelectedFile64String = "";
    return;
  }

  adhocSelectedFile = file;

  const reader = new FileReader();

  reader.onload = function (event) {
    adhocSelectedFile64String = event.target.result;

    const preview = document.getElementById("adhocImagePreview");

    const previewContainer = document.getElementById(
      "adhocImagePreviewContainer",
    );

    preview.src = event.target.result;
    previewContainer.style.display = "block";
  };

  reader.readAsDataURL(file);
}

function adhocResetCreateTask() {
  document.getElementById("adhocCategory").value = "";

  document.getElementById("adhocTaskOwner").value = "";

  document.getElementById("adhocTaskReviewer").value = "";

  document.getElementById("adhocTaskDescription").value = "";

  document.getElementById("adhocUploadControl").value = "";

  document.getElementById("adhocImagePreview").src = "";

  document.getElementById("adhocImagePreviewContainer").style.display = "none";

  adhocSelectedFile = null;
  adhocSelectedFile64String = "";
}

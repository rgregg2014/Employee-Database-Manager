//NOTE: I commented the manager stuff out after making the video. The option has been removed from this version of the project.

// DEPENDENCIES =========================================================================================================================

const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");

// GLOBAL DATA ==========================================================================================================================
//-------(I wanted to try using a destructured object in a prompt. If there's ever a time I need to use the same answers multiple times across several questions. It also made the switch cases cleaner and easier to understand. Plus, it allowed flexibility within prompts further down the page.)

const promptChoices = {
  allEmployees: "View All Employees",
  viewByDepartment: "View All Employees by Department",
  viewByManager: "View All Employees by Manager",
  addEmployee: "Add an Employee",
  removeEmployee: "Remove an Employee",
  updateRole: "Update Employee Role",
  updateEmployeeManager: "Update an Employee's Manager",
  allRoles: "View All Roles",
  exit: "Exit",
};

// SETTING UP THE CONNECTION TO THE DATABASE ============================================================================================

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "sisyphus",
  database: "employees",
});

// INITIATING THE CONNECTION =============================================================================================================

connection.connect((err) => {
  if (err) throw err;
  console.log("Connection listening");
  prompt();
});

// INITIALIZING FUNCTION W/ INQUIRER PROMPT AND SWITCH CASE ==============================================================================

function prompt() {
  inquirer
    .prompt({
      name: "action",
      type: "list",
      message: "What would you like to do?",
      choices: [
        promptChoices.allEmployees,
        promptChoices.viewByDepartment,
        //promptChoices.viewByManager,
        promptChoices.allRoles,
        promptChoices.addEmployee,
        promptChoices.removeEmployee,
        promptChoices.updateRole,
        promptChoices.exit,
      ],
    })
    .then((answer) => {
      console.log("answer", answer);
      switch (answer.action) {
        case promptChoices.allEmployees:
          viewEmployeeData();
          break;
        case promptChoices.viewByDepartment:
          viewDepartmentData();
          break;
        /*case promptChoices.viewByManager:
          viewByManager();
          break;*/
        case promptChoices.addEmployee:
          addEmployee();
          break;
        case promptChoices.removeEmployee:
          alterData("delete");
          break;
        case promptChoices.updateRole:
          alterData("role");
          break;
        case promptChoices.allRoles:
          viewRoleData();
          break;
        case promptChoices.exit:
          connection.end();
          break;
      }
    });
}

// SECONDARY FUNCTIONS, CALLED WHEN CASES ARE MET IN INITIALIZING FUNCTION ===============================================================

function viewEmployeeData() {
  const query = `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
  FROM employee
  LEFT JOIN employee manager on manager.id = employee.manager_id
  INNER JOIN role ON (role.id = employee.role_id)
  INNER JOIN department ON (department.id = role.department_id)
  ORDER BY employee.id`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.log("\n");
    console.log("VIEW ALL EMPLOYEES");
    console.log("\n");
    console.table(res);
    prompt();
  });
}

function viewDepartmentData() {
  const query = `SELECT department.name AS department, role.title, employee.id, employee.first_name, employee.last_name
    FROM employee
    LEFT JOIN role ON (role.id = employee.role_id)
    LEFT JOIN department ON (department.id = role.department_id)
    ORDER BY department.name;`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.log("\n");
    console.log("VIEW EMPLOYEES BY DEPARTMENT");
    console.log("\n");
    console.table(res);
    prompt();
  });
}

// This is returning an empty table, still working out why.
/*function viewByManager() {
  const query = `SELECT CONCAT(manager.first_name, ' ', manager.last_name) AS manager, department.name AS department, employee.id, employee.first_name, employee.last_name, role.title
    FROM employee
    LEFT JOIN employee manager ON manager.id = employee.manager_id
    INNER JOIN role ON (role.id = employee.role_id && employee.manager_id != NULL)
    INNER JOIN department ON (department.id = role.department_id)
    ORDER BY manager;`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.log("\n");
    console.log("VIEW EMPLOYEES BY MANAGER");
    console.log("\n");
    console.table(res);
    prompt();
  });
}*/

function viewRoleData() {
  const query = `SELECT role.title, employee.id, employee.first_name, employee.last_name, department.name AS department
    FROM employee
    LEFT JOIN role ON (role.id = employee.role_id)
    LEFT JOIN department ON (department.id = role.department_id)
    ORDER BY role.title;`;
  connection.query(query, (err, res) => {
    if (err) throw err;
    console.log("\n");
    console.log("VIEW EMPLOYEES BY ROLE");
    console.log("\n");
    console.table(res);
    prompt();
  });
}

async function addEmployee() {
  const addName = await inquirer.prompt(askName());
  connection.query(
    `SELECT role.id, role.title FROM role ORDER BY role.id;`,
    async (err, res) => {
      if (err) throw err;
      const { role } = await inquirer.prompt([
        {
          name: "role",
          type: "list",
          choices: () => res.map((res) => res.title),
          message: "What is the employee role?",
        },
      ]);
      let roleId;
      for (const row of res) {
        if (row.title === role) {
          roleId = row.id;
          continue;
        }
      }
      connection.query(`SELECT * FROM employee`, async (err, res) => {
        if (err) throw err;
        let choices = res.map((res) => `${res.first_name} ${res.last_name}`);
        choices.push("none");
        let { manager } = await inquirer.prompt([
          {
            name: "manager",
            type: "list",
            choices: choices,
            message: "Please select the employee's manager:",
          },
        ]);
        let managerId;
        let managerName;
        if (manager === "none") {
          managerId = null;
        } else {
          for (const data of res) {
            data.fullName = `${data.first_name} ${data.last_name}`;
            if (data.fullName === manager) {
              managerId = data.id;
              managerName = data.fullName;
              console.log(managerId);
              console.log(managerName);
              continue;
            }
          }
        }
        console.log("New employee added. Please verify in database.");
        connection.query(
          `INSERT INTO employee SET ?`,
          {
            first_name: addName.first,
            last_name: addName.last,
            role_id: roleId,
            manager_id: parseInt(managerId),
          },
          (err, res) => {
            if (err) throw err;
            prompt();
          }
        );
      });
    }
  );
}

function alterData(input) {
  const promptQuest = {
    yes: "yes",
    no: "no (view employee list)",
  };
  inquirer
    .prompt([
      {
        name: "action",
        type: "list",
        message:
          "To proceed, you will need the employee's ID. Do you have the necessary ID?",
        choices: [promptQuest.yes, promptQuest.no],
      },
    ])
    .then((answer) => {
      if (input === "delete" && answer.action === "yes") removeEmployee();
      else if (input === "role" && answer.action === "yes") updateRole();
      else viewEmployeeData();
    });
}

async function removeEmployee() {
  const answer = await inquirer.prompt([
    {
      name: "first",
      type: "input",
      message: "Please enter the ID you want to remove: ",
    },
  ]);
  connection.query(
    "DELETE FROM employee WHERE ?",
    {
      id: answer.first,
    },
    function (err) {
      if (err) throw err;
    }
  );
  console.log(
    "Employee has been removed from the system. Please verify your records."
  );
  prompt();
}

async function updateRole() {
  const employeeId = await inquirer.prompt(askId());

  connection.query(
    "SELECT role.id, role.title FROM role ORDER BY role.id",
    async (err, res) => {
      if (err) throw err;
      const { role } = await inquirer.prompt([
        {
          name: "role",
          type: "list",
          choices: () => res.map((res) => res.title),
          message: "What is the employee's new role?",
        },
      ]);
      let roleId;
      for (const row of res) {
        if (row.title === role) {
          roleId = row.id;
          continue;
        }
      }
      connection.query(
        `UPDATE employee
          SET role_id = ${roleId}
          WHERE employee.id = ${employeeId.name}`,
        async (err, res) => {
          if (err) throw err;
          console.log("Role has been updated. Please verify your records.");
          prompt();
        }
      );
    }
  );
}

//Convenience functions, I ask these a few times and wanted to make the bigger functions look cleaner

function askId() {
  return [
    {
      name: "name",
      type: "input",
      message: "What is the employee's ID?",
    },
  ];
}

function askName() {
  return [
    {
      name: "first",
      type: "input",
      message: "Please enter the employee's first name: ",
    },
    {
      name: "last",
      type: "input",
      message: "Please enter the employee's last name: ",
    },
  ];
}

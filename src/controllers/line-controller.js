const { readFile, writeFile } = require("fs");
const { promisify } = require("util");
const { v4: uuidv4 } = require('uuid');
const { validate } = require("email-validator");

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

const filePathUsers = "src/data/users.json";
const filePathLine = "src/data/line.json";

exports.createUser = async (req, res) => {
    try {
        const users = JSON.parse(await readFileAsync(filePathUsers, "utf8"));
        const data = {
            "id": req.body.id ? req.body.id : uuidv4(),
            "name": validateRequiredParameters(req.body.name, "name"),
            "email": checkExistsUser("email", users, validateEmail(req.body.email)),
            "gender": validateRequiredParameters(req.body.gender, "gender")
        }
        users.push(data);
        await writeFileAsync(filePathUsers, JSON.stringify(users));
        res.status(201).send(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.addToLine = async (req, res) => {
    try {
        const users = JSON.parse(await readFileAsync(filePathUsers, "utf8"));
        const line = JSON.parse(await readFileAsync(filePathLine, "utf8"));
        const searchLine = users.find(user => user.id == checkExistsUser("id", line, req.body.id));
        if (searchLine) {
            line.push(searchLine);
            await writeFileAsync(filePathLine, JSON.stringify(line));
            res.status(201).send((line.findIndex(user => user.id == req.body.id) + 1).toString());
        } else {
            res.status(400).send({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.findPosition = async (req, res) => {
    try {
        const lineUsers = [];
        const users = JSON.parse(await readFileAsync(filePathLine, "utf8"));
        for (const data of users) {
            await lineUsers.push(data);
        }
        const searchLine = lineUsers.findIndex(user => user.email == validateEmail(req.body.email));
        if (searchLine !== -1) {
            res.status(201).send((searchLine + 1).toString());
        } else {
            res.status(400).send({ message: "Email not found" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.showLine = async (req, res) => {
    try {
        const lineUsers = [];
        const users = JSON.parse(await readFileAsync(filePathLine, "utf8"));
        if (users.length > 0) {
            for (var i = 0; i < users.length; i++) {
                delete users[i].id;
                const position = {
                    ...users[i],
                    "position": i + 1
                }
                lineUsers.push(position);
            }
            res.status(201).send(lineUsers);
        } else {
            res.status(400).send({ message: "Line is empty" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.filterLine = async (req, res) => {
    try {
        const lineUsers = [];
        const users = JSON.parse(await readFileAsync(filePathLine, "utf8"));
        for (var i = 0; i < users.length; i++) {
            delete users[i].id;
            const position = {
                ...users[i],
                "position": i + 1
            }
            lineUsers.push(position);
        }
        const filterGender = lineUsers.filter((user) => {
            return user.gender == validateRequiredParameters(req.body.gender, "gender");
        })
        if (filterGender.length > 0) {
            res.status(201).send(filterGender);
        } else {
            res.status(400).send({ message: "Gender not found" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.popLine = async (req, res) => {
    try {
        const users = require("../data/line.json")
        const removedUser = users[0];
        if (removedUser) {
            users.shift();
            await writeFileAsync(filePathLine, JSON.stringify(users));
            res.status(201).send(removedUser);
        } else {
            res.status(400).send({ message: "Line is empty" });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

function checkExistsUser(type, user, parameter) {
    validateRequiredParameters(parameter, type);
    const checkUser = user.find(user => user[type] == parameter);
    if (checkUser) {
        throw new Error("User already exists");
    }
    return parameter;
}

function validateEmail(email) {
    if (!validate(validateRequiredParameters(email, "email"))) {
        throw new Error("Invalid Email");
    }
    return email;
}

function validateRequiredParameters(parameter, type) {
    if(!parameter) {
        throw new Error(`${type} is required`);
    }
    return parameter;
}

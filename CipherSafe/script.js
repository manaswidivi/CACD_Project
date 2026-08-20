/* =========================================
   CIPHERSAFE
   SECURE PASSWORD VAULT
   ========================================= */


/* =========================================
   LOGIN ELEMENTS
   ========================================= */

const loginButton =
    document.getElementById("loginBtn");

const passwordInput =
    document.getElementById("masterPassword");

const message =
    document.getElementById("message");

const showPassword =
    document.getElementById("showPassword");


/* =========================================
   VAULT ELEMENTS
   ========================================= */

const loginScreen =
    document.querySelector(".main-content");

const loginWorkflow =
    document.querySelector(".workflow");

const vaultDashboard =
    document.getElementById("vaultDashboard");

const lockVault =
    document.getElementById("lockVault");

const addCredentialBtn =
    document.getElementById("addCredentialBtn");

const credentialForm =
    document.getElementById("credentialForm");

const closeForm =
    document.getElementById("closeForm");

const saveCredential =
    document.getElementById("saveCredential");

const credentialList =
    document.getElementById("credentialList");

const searchInput =
    document.getElementById("searchInput");


/* =========================================
   CREDENTIAL INPUTS
   ========================================= */

const websiteInput =
    document.getElementById("websiteInput");

const usernameInput =
    document.getElementById("usernameInput");

const credentialPasswordInput =
    document.getElementById(
        "credentialPasswordInput"
    );


/* =========================================
   TEMPORARY VAULT STORAGE
   ========================================= */

let credentials = [];


/* =========================================
   UNLOCK VAULT
   ========================================= */

loginButton.addEventListener(
    "click",
    function () {

        const password =
            passwordInput.value.trim();


        /* Empty password */

        if (password === "") {

            message.textContent =
                "Please enter your master password.";

            message.style.color =
                "#b42318";

            return;
        }


        /* Authentication */

        message.textContent =
            "Authentication successful!";

        message.style.color =
            "#111";


        loginButton.querySelector("span").textContent =
            "VAULT UNLOCKED";


        /*
         * Hide login interface
         */

        setTimeout(function () {

            loginScreen.style.display =
                "none";

            loginWorkflow.style.display =
                "none";

            vaultDashboard.style.display =
                "block";


            /*
             * Scroll to vault
             */

            vaultDashboard.scrollIntoView({
                behavior: "smooth"
            });


            loginButton.querySelector("span").textContent =
                "UNLOCK VAULT";

        }, 700);

    }
);


/* =========================================
   SHOW / HIDE MASTER PASSWORD
   ========================================= */

showPassword.addEventListener(
    "click",
    function () {

        if (
            passwordInput.type ===
            "password"
        ) {

            passwordInput.type =
                "text";

            showPassword.textContent =
                "◎";

        } else {

            passwordInput.type =
                "password";

            showPassword.textContent =
                "◉";
        }

    }
);


/* =========================================
   ENTER KEY LOGIN
   ========================================= */

passwordInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            loginButton.click();

        }

    }
);


/* =========================================
   ADD CREDENTIAL BUTTON
   ========================================= */

addCredentialBtn.addEventListener(
    "click",
    function () {

        credentialForm.style.display =
            "block";


        websiteInput.focus();


        credentialForm.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }
);


/* =========================================
   CLOSE FORM
   ========================================= */

closeForm.addEventListener(
    "click",
    function () {

        credentialForm.style.display =
            "none";

        clearForm();

    }
);


/* =========================================
   SAVE CREDENTIAL
   ========================================= */

saveCredential.addEventListener(
    "click",
    function () {

        const website =
            websiteInput.value.trim();

        const username =
            usernameInput.value.trim();

        const password =
            credentialPasswordInput.value;


        /* Validation */

        if (
            website === "" ||
            username === "" ||
            password === ""
        ) {

            alert(
                "Please fill in all credential fields."
            );

            return;
        }


        /* Create credential */

        const newCredential = {

            id: Date.now(),

            website: website,

            username: username,

            password: password

        };


        /* Store credential */

        credentials.push(
            newCredential
        );


        /* Update screen */

        renderCredentials();


        /* Close form */

        credentialForm.style.display =
            "none";


        clearForm();

    }
);


/* =========================================
   DISPLAY CREDENTIALS
   ========================================= */

function renderCredentials(
    filteredCredentials = credentials
) {

    credentialList.innerHTML = "";


    /* Empty vault */

    if (
        filteredCredentials.length === 0
    ) {

        credentialList.innerHTML = `

            <div class="empty-message">

                <strong>YOUR VAULT IS EMPTY</strong>

                <p>
                    Click "+ ADD CREDENTIAL"
                    to store your first credential.
                </p>

            </div>

        `;

        return;
    }


    /* Create cards */

    filteredCredentials.forEach(
        function (credential, index) {

            const card =
                document.createElement("div");


            card.className =
                "credential-card";


            card.innerHTML = `

                <div class="credential-top">

                    <div class="website-name">
                        ${escapeHTML(
                            credential.website
                        )}
                    </div>

                    <div class="credential-number">
                        CREDENTIAL ${String(
                            index + 1
                        ).padStart(2, "0")}
                    </div>

                </div>


                <div class="credential-info">

                    <div>
                        USERNAME:
                        ${escapeHTML(
                            credential.username
                        )}
                    </div>


                    <div class="password-row">

                        <span>
                            PASSWORD:
                        </span>

                        <span
                            class="password-value"
                            data-password="${escapeHTML(
                                credential.password
                            )}"
                        >
                            ••••••••
                        </span>

                    </div>

                </div>


                <div class="card-actions">

                    <button
                        onclick="toggleCardPassword(this)"
                    >
                        SHOW PASSWORD
                    </button>


                    <button
                        onclick="deleteCredential(
                            ${credential.id}
                        )"
                    >
                        DELETE
                    </button>

                </div>

            `;


            credentialList.appendChild(card);

        }
    );

}


/* =========================================
   SHOW / HIDE SAVED PASSWORD
   ========================================= */

function toggleCardPassword(button) {

    const passwordValue =
        button
            .closest(".credential-card")
            .querySelector(
                ".password-value"
            );


    const realPassword =
        passwordValue.dataset.password;


    if (
        passwordValue.textContent ===
        "••••••••"
    ) {

        passwordValue.textContent =
            realPassword;

        button.textContent =
            "HIDE PASSWORD";

    } else {

        passwordValue.textContent =
            "••••••••";

        button.textContent =
            "SHOW PASSWORD";

    }

}


/* =========================================
   DELETE CREDENTIAL
   ========================================= */

function deleteCredential(id) {

    credentials =
        credentials.filter(
            function (credential) {

                return credential.id !== id;

            }
        );


    renderCredentials();

}


/* =========================================
   SEARCH
   ========================================= */

searchInput.addEventListener(
    "input",
    function () {

        const searchTerm =
            searchInput.value
                .toLowerCase()
                .trim();


        const filtered =
            credentials.filter(
                function (credential) {

                    return (

                        credential.website
                            .toLowerCase()
                            .includes(searchTerm)

                        ||

                        credential.username
                            .toLowerCase()
                            .includes(searchTerm)

                    );

                }
            );


        renderCredentials(filtered);

    }
);


/* =========================================
   LOCK VAULT
   ========================================= */

lockVault.addEventListener(
    "click",
    function () {

        vaultDashboard.style.display =
            "none";


        loginScreen.style.display =
            "grid";


        loginWorkflow.style.display =
            "block";


        passwordInput.value =
            "";

        message.textContent =
            "";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


/* =========================================
   CLEAR FORM
   ========================================= */

function clearForm() {

    websiteInput.value =
        "";

    usernameInput.value =
        "";

    credentialPasswordInput.value =
        "";

}


/* =========================================
   SECURITY
   Prevent HTML injection in displayed data
   ========================================= */

function escapeHTML(value) {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
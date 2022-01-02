

const login = async ({ email, password }) => {
    try {
        const response = await fetch('http://127.0.0.1:3000/api/v1/users/signin', {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw response;
        const data = await response.json();
        if (data.status === "success") {
            location.assign("/");
        };
        console.log(data)
    } catch (err) {
        return err.text().then(errorMessage => {
            console.error("ERROR", JSON.parse(errorMessage))
        });
    }
};



document.querySelector(".form").addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login({ email, password });
});
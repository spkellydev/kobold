document.getElementById("add").addEventListener("submit", e => {
    e.preventDefault();
    const value = document.getElementById("input").value;
    
    document.getElementById("list").innerHTML = value;
})

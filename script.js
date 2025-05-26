$(document).ready(function () {
  var allCharacters = [];
  let table;

  function format(data) {
    return (
      `<div style="display: flex; padding: 10px; background-color: #f0f0f0; gap:10px;">` +
      `<div style="align-items:center; margin: 20px">` +
      `<dl>` +
      `<dt style="font-weight:bold; color: #333333;">FullName:</dt>` +
      `<dd style="margin-left: 40px; color: #666666;">${data.name}</dd>` +
      `<dt style="font-weight: bold; color: #333;">Location:</dt>` +
      `<dd style="margin-left: 40px; color: #666;">${data.location.name}</dd>` +
      `</dl>` +
      `</div>` +
      `<div style="align-items:center; margin: 20px">` +
      `<dt style="font-weight: bold; color: #333;">Image:</dt>` +
      `<img src="${data.image}" alt="${data.name}" style="max-width: 120px; height:auto; display: block; margin:10px 80px;">` +
      `</div>` +
      `</div>`
    );
  }

  function fetchCharacters(url) {
    $.ajax({
      url: url,
      dataType: "json",
      success: function (data) {
        allCharacters = allCharacters.concat(data.results);
        localStorage.setItem('data', JSON.stringify(allCharacters))
        if (data.info.next) {
          fetchCharacters(data.info.next);
        } else {
          table = $("#rickyAndMortyTable").DataTable({
            data: JSON.parse(localStorage.getItem('data')),
            columns: [
              { className: "dt-control", data: null, defaultContent: " ", orderable: false },
              { data: "id" },
              { data: "name" },
              { data: "status" },
              { data: "species" },
              { data: "gender" },
              { data: "origin.name" },
              { data: null },
            ],
            columnDefs: [
              {
                targets: 7,
                render: function (data, type, row) {
                  return `
                    <button class="btn btn-warning btn-sm editbtn" value="${row.id}">Edit</button>
                    <button class="btn btn-danger btn-sm deletebtn" value="${row.id}">Delete</button>
                  `;
                },
              },
            ],
          });

          $("#rickyAndMortyTable tbody").on("click", "td.dt-control", function () {
            let $row = $(this).closest("tr");
            let cell = table.row($row);
            if (cell.child.isShown()) {
              cell.child.hide();
            } else {
              cell.child(format(cell.data())).show();
            }
          });

          $("#rickyAndMortyTable tbody").on("click", ".editbtn", function () {
            let row = $(this).closest("tr");
            let originalData = table.row(row).data(); // Store original data
            row.find("td").each(function (index) {
              if (index > 1 && index < 7) {
                let value = $(this).text().trim();
                $(this).html(`<input type="text" class="form-control form-control-sm" value="${value}">`);
              }
            });
            $(this).removeClass("btn-warning editbtn").addClass("btn-success savebtn").text("Save");
            $(this).data("originalData", originalData); // Attach original data to the button
          });

          $("#rickyAndMortyTable tbody").on("click", ".savebtn", function () {
            let row = $(this).closest("tr");
            let inputs = row.find("input");
            let originalData = $(this).data("originalData"); // Retrieve original data

            // Collect new values, default to original if empty
            const updateData = {
              id: originalData.id,
              name: inputs.eq(0).val().trim() || originalData.name,
              status: inputs.eq(1).val().trim() || originalData.status,
              species: inputs.eq(2).val().trim() || originalData.species,
              gender: inputs.eq(3).val().trim() || originalData.gender,
              origin: { name: inputs.eq(4).val().trim() || originalData.origin.name },
            };

            // allCharacters.push(updateData)
            // localStorage.setItem('data', JSON.stringify(allCharacters))
            
            // Validate and update
           table.row(row).data(updateData).draw(false);
           allCharacters.push(updateData)
           localStorage.setItem('data', JSON.stringify(allCharacters))
            $(this).removeClass("savebtn btn-success").addClass("editbtn btn-warning").text("Edit");
          });

          // delete button evente listener
          $("#rickyAndMortyTable tbody").on("click", ".deletebtn", function () {
            localStorage.setItem('data', JSON.stringify(allCharacters))
            table.row($(this).closest("tr")).remove().draw(false);
           
          });
        }
      },
      error: function (xhr, status, error) {
        console.error("API fetch error:", error);
      },
    });
  }

  fetchCharacters("https://rickandmortyapi.com/api/character");


  // model validation
  $("#staticBackdrop").on("show.bs.modal", function () {
    const maxId = allCharacters.length ? Math.max(...allCharacters.map(char => parseInt(char.id))) : 0;
    $("#id").val(maxId + 1);
    $(".text-danger").text("");
  });

  function validateForm() {
    let isValid = true; 
    $(".text-danger").text("");
    if (!$("#name").val().trim()) {
      $("#nameError").text("Name is required");
      isValid = false;
    }
    if (!$("#status").val()) {
      $("#statusError").text("Please select a status");
      isValid = false;
    }                       
    if (!$("#species").val()) {
      $("#speciesError").text("Please select a species");
      isValid = false;
    }
    if (!$("#gender").val()) {
      $("#genderError").text("Please select a gender");
      isValid = false;
    }
    if (!$("#origin").val().trim()) {
      $("#originError").text("Origin is required");
      isValid = false;
    }
    if (!$("#location").val().trim()) {
      $("#locationError").text("Location is required");
      isValid = false;
    }
    const imageUrl = $("#imageUrl").val().trim();
    const imageFile = $("#imageFile")[0].files[0];
    if (!imageUrl && !imageFile) {
      $("#imageError").text("Please provide an image URL or upload a file");
      isValid = false;
    }
    return isValid;
  }

  $("#modalForm input, #modalForm select").on("input change", function () {
    const id = $(this).attr("id");
    const errorId = `#${id}Error`;
    const value = $(this).val();
    if (id === "imageFile" || id === "imageUrl") {
      const imageUrl = $("#imageUrl").val().trim();
      const imageFile = $("#imageFile")[0].files[0];
      $("#imageError").text(imageUrl || imageFile ? "" : "Please provide an image URL or upload a file");
    } else { 
      $(errorId).text(
        value && value.trim() ? "" : 
        id.includes("status") || id.includes("species") || id.includes("gender") ? 
        `Please select a ${id}` : `${id.charAt(0).toUpperCase() + id.slice(1)} is required`
      );
    }
  });

  

  $("#submitBtn").on("click", function (e) {
    e.preventDefault();
    if (validateForm()) {
      const newCharacter = {
        id: $("#id").val(),
        name: $("#name").val().trim(),
        status: $("#status").val(),
        species: $("#species").val(),
        gender: $("#gender").val(),
        origin: { name: $("#origin").val().trim() },
        location: { name: $("#location").val().trim() },
        image: $("#imageUrl").val().trim() || URL.createObjectURL($("#imageFile")[0].files[0]),
      };
      allCharacters.push(newCharacter);
      table.row.add(newCharacter).draw(false);
      $("#modalForm")[0].reset();
      $("#staticBackdrop").modal("hide");
    }
  });
});
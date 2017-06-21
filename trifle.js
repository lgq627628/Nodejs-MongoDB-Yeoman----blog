<% if(errors && errors.length){ %>
    <div class="errors">
      <% errors.forEach(function(error){ %>
        <p class="alert alert-danger"><%= error.msg %></p>
      <% }) %>
    </div>
  <% } %>
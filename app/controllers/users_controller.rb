class UsersController < ApplicationController
  def show
    @user = resume_session.user
  end
end

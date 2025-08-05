class RegistrationsController < ApplicationController
  allow_unauthenticated_access

  def new
    redirect_to root_url if authenticated?
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      UserMailer.with(user: @user).welcome_email.deliver_later
      start_new_session_for @user
      redirect_to after_authentication_url, notice: "Welcome, #{@user.email_address}!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

    def user_params
      params.require(:user).permit(:email_address, :password, :password_confirmation)
    end
end

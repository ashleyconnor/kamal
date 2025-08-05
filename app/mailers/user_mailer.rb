class UserMailer < ApplicationMailer
  def welcome_email
    @user = params[:user]
    @url  = new_session_url
    mail(to: @user.email_address, subject: "Welcome to My Site")
  end
end

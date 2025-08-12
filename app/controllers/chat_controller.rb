class ChatController < ApplicationController
  before_action :require_authentication

  def index
    current_user = resume_session.user
    render "chat/index", locals: { current_user: current_user }
  end
end
